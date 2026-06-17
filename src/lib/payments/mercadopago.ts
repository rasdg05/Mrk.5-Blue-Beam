import { createHmac, timingSafeEqual } from 'crypto';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import type { PaymentMethodType, PaymentStatus } from '@prisma/client';
import { env, requireEnv } from '@/lib/env';
import { centavosToPesos, pesosToCentavos } from '@/lib/money';
import type { PaymentProvider, IncomingWebhook } from './provider';
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  ProviderStatus,
  RefundInput,
  RefundResult,
  WebhookParseResult,
} from './types';

const MP_API = 'https://api.mercadopago.com';

function mapStatus(s?: string | null): PaymentStatus {
  switch (s) {
    case 'approved':
      return 'APPROVED';
    case 'authorized':
    case 'in_process':
    case 'in_mediation':
      return 'IN_PROCESS';
    case 'pending':
      return 'PENDING';
    case 'rejected':
      return 'REJECTED';
    case 'cancelled':
      return 'CANCELLED';
    case 'refunded':
      return 'REFUNDED';
    case 'charged_back':
      return 'REFUNDED';
    default:
      return 'PENDING';
  }
}

function mapMethod(typeId?: string | null): PaymentMethodType | undefined {
  switch (typeId) {
    case 'credit_card':
    case 'debit_card':
    case 'prepaid_card':
      return 'CARD';
    case 'ticket':
      return 'OXXO';
    case 'bank_transfer':
    case 'atm':
      return 'SPEI';
    case 'account_money':
      return 'WALLET';
    default:
      return typeId ? 'OTHER' : undefined;
  }
}

export class MercadoPagoProvider implements PaymentProvider {
  readonly id = 'MERCADOPAGO' as const;

  private client(): MercadoPagoConfig {
    return new MercadoPagoConfig({
      accessToken: requireEnv('MERCADOPAGO_ACCESS_TOKEN'),
      options: { timeout: 10_000 },
    });
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const preference = new Preference(this.client());
    const res = await preference.create({
      body: {
        items: [
          {
            id: input.orderId,
            title: input.description,
            quantity: 1,
            unit_price: centavosToPesos(input.amount.amount),
            currency_id: 'MXN',
          },
        ],
        external_reference: input.orderId,
        metadata: { ...input.metadata, order_number: input.orderNumber, kind: input.kind },
        notification_url: input.notificationUrl,
        back_urls: {
          success: input.successUrl,
          failure: input.failureUrl,
          pending: input.pendingUrl,
        },
        auto_return: 'approved',
        statement_descriptor: 'AUTOSMX',
        payer: {
          email: input.buyer.email,
          name: input.buyer.name,
        },
      },
      requestOptions: { idempotencyKey: input.idempotencyKey },
    });

    const checkoutUrl = res.init_point;
    if (!res.id || !checkoutUrl) {
      throw new Error('Mercado Pago did not return a preference id / init_point');
    }

    return {
      providerRef: String(res.id),
      checkoutUrl,
      status: 'PENDING',
      raw: res,
    };
  }

  async parseAndVerifyWebhook(req: IncomingWebhook): Promise<WebhookParseResult> {
    const body = safeJson(req.rawBody);
    const dataId =
      req.url.searchParams.get('data.id') ??
      (body?.data?.id != null ? String(body.data.id) : undefined);
    const type = req.url.searchParams.get('type') ?? body?.type ?? body?.action;

    if (!this.verifySignature(req, dataId)) {
      throw new Error('Invalid Mercado Pago webhook signature');
    }

    // We only act on payment notifications.
    if (!dataId || (type && !String(type).includes('payment'))) {
      throw new Error(`Ignoring non-payment Mercado Pago notification: ${type}`);
    }

    // Webhook is a ping — fetch the authoritative status.
    const status = await this.getStatus(dataId);
    const notificationId = body?.id != null ? String(body.id) : `${dataId}:${body?.action ?? ''}`;

    return {
      providerRef: dataId, // the PAYMENT id (replaces the preference id stored at create)
      orderId: status.externalReference,
      eventId: `mp_${notificationId}`,
      status: status.status,
      method: status.method,
      amountPaid: status.amountPaid,
      raw: status.raw,
    };
  }

  async getStatus(paymentId: string): Promise<ProviderStatus> {
    const payment = new Payment(this.client());
    const res = await payment.get({ id: paymentId });
    const amount =
      typeof res.transaction_amount === 'number'
        ? { amount: pesosToCentavos(res.transaction_amount), currency: 'MXN' as const }
        : undefined;
    return {
      status: mapStatus(res.status),
      method: mapMethod(res.payment_type_id),
      amountPaid: amount,
      externalReference: res.external_reference ?? undefined,
      raw: res,
    };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    const accessToken = requireEnv('MERCADOPAGO_ACCESS_TOKEN');
    const isPartial = input.amount != null;
    const res = await fetch(`${MP_API}/v1/payments/${input.providerRef}/refunds`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `refund_${input.providerRef}_${input.amount?.amount ?? 'full'}`,
      },
      body: isPartial
        ? JSON.stringify({ amount: centavosToPesos(input.amount!.amount) })
        : JSON.stringify({}),
    });
    const json = (await res.json()) as { id?: number | string; status?: string };
    if (!res.ok) {
      throw new Error(`Mercado Pago refund failed (${res.status}): ${JSON.stringify(json)}`);
    }
    return {
      status: isPartial ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
      providerRefundRef: json.id != null ? String(json.id) : undefined,
      raw: json,
    };
  }

  private verifySignature(req: IncomingWebhook, dataId: string | undefined): boolean {
    const secret = env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!secret) {
      if (env.NODE_ENV === 'production') return false;
      console.warn('[mercadopago] MERCADOPAGO_WEBHOOK_SECRET not set — skipping verification (dev)');
      return true;
    }
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    if (!xSignature || !dataId) return false;

    // x-signature: "ts=1700000000,v1=hexhash"
    const parts = Object.fromEntries(
      xSignature.split(',').map((kv) => {
        const [k, v] = kv.split('=');
        return [k?.trim() ?? '', v?.trim() ?? ''];
      }),
    );
    const ts = parts['ts'];
    const v1 = parts['v1'];
    if (!ts || !v1) return false;

    // data.id must be lowercased if alphanumeric
    const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId ?? ''};ts:${ts};`;
    const computed = createHmac('sha256', secret).update(manifest).digest('hex');
    try {
      return timingSafeEqual(Buffer.from(computed), Buffer.from(v1));
    } catch {
      return false;
    }
  }
}

interface MpWebhookBody {
  id?: number | string;
  type?: string;
  action?: string;
  data?: { id?: number | string };
}

function safeJson(raw: string): MpWebhookBody | undefined {
  try {
    return raw ? (JSON.parse(raw) as MpWebhookBody) : undefined;
  } catch {
    return undefined;
  }
}
