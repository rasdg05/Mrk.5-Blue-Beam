import { createHmac, timingSafeEqual } from 'crypto';
import type { PaymentStatus } from '@prisma/client';
import { requireEnv } from '@/lib/env';
import { centavosToPesos, pesosToCentavos } from '@/lib/money';
import type { IncomingWebhook, PaymentProvider } from './provider';
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  ProviderStatus,
  RefundInput,
  RefundResult,
  WebhookParseResult,
} from './types';

/**
 * NOWPayments crypto-stablecoin adapter (Phase 2 fast path). Hosted invoice
 * checkout + IPN (HMAC-SHA512 over the key-sorted JSON body). Settlement to MXN
 * is configured account-side. Refunds are out of band (on-chain) and not
 * supported programmatically here.
 */
const NP_API = 'https://api.nowpayments.io/v1';

function mapStatus(s?: string | null): PaymentStatus {
  switch (s) {
    case 'finished':
    case 'confirmed':
    case 'sending':
      return 'APPROVED';
    case 'confirming':
      return 'CONFIRMING';
    case 'waiting':
      return 'PENDING';
    case 'partially_paid':
      return 'UNDERPAID';
    case 'failed':
      return 'REJECTED';
    case 'refunded':
      return 'REFUNDED';
    case 'expired':
      return 'EXPIRED';
    default:
      return 'PENDING';
  }
}

export class NowPaymentsProvider implements PaymentProvider {
  readonly id = 'NOWPAYMENTS' as const;

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const apiKey = requireEnv('NOWPAYMENTS_API_KEY');
    const res = await fetch(`${NP_API}/invoice`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price_amount: centavosToPesos(input.amount.amount),
        price_currency: 'mxn',
        order_id: input.orderId,
        order_description: input.description,
        ipn_callback_url: input.notificationUrl,
        success_url: input.successUrl,
        cancel_url: input.failureUrl,
      }),
    });
    const json = (await res.json()) as { id?: string | number; invoice_url?: string };
    if (!res.ok || !json.id || !json.invoice_url) {
      throw new Error(`NOWPayments invoice failed (${res.status}): ${JSON.stringify(json)}`);
    }
    return {
      providerRef: String(json.id),
      checkoutUrl: json.invoice_url,
      status: 'PENDING',
      raw: json,
    };
  }

  async parseAndVerifyWebhook(req: IncomingWebhook): Promise<WebhookParseResult> {
    const secret = requireEnv('NOWPAYMENTS_IPN_SECRET');
    const signature = req.headers.get('x-nowpayments-sig');
    if (!signature || !this.verifySignature(req.rawBody, signature, secret)) {
      throw new Error('Invalid NOWPayments IPN signature');
    }
    const body = JSON.parse(req.rawBody) as {
      payment_id?: string | number;
      payment_status?: string;
      order_id?: string;
      price_amount?: number | string;
      pay_currency?: string;
    };
    const status = mapStatus(body.payment_status);
    const amountPaid =
      status === 'APPROVED' && body.price_amount != null
        ? { amount: pesosToCentavos(Number(body.price_amount)), currency: 'MXN' as const }
        : undefined;
    return {
      providerRef: String(body.payment_id ?? ''),
      orderId: body.order_id,
      eventId: `np_${body.payment_id}_${body.payment_status}`,
      status,
      method: body.pay_currency?.toLowerCase().includes('usdc') ? 'CRYPTO_USDC' : 'CRYPTO_USDT',
      amountPaid,
      raw: body,
    };
  }

  async getStatus(providerRef: string): Promise<ProviderStatus> {
    const apiKey = requireEnv('NOWPAYMENTS_API_KEY');
    const res = await fetch(`${NP_API}/payment/${providerRef}`, {
      headers: { 'x-api-key': apiKey },
    });
    const json = (await res.json()) as {
      payment_status?: string;
      order_id?: string;
      price_amount?: number;
    };
    return {
      status: mapStatus(json.payment_status),
      externalReference: json.order_id,
      amountPaid:
        json.price_amount != null
          ? { amount: pesosToCentavos(Number(json.price_amount)), currency: 'MXN' }
          : undefined,
      raw: json,
    };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    throw new Error(
      `Crypto refunds are handled out of band (on-chain) for ${input.providerRef} — not supported via API.`,
    );
  }

  private verifySignature(rawBody: string, signature: string, secret: string): boolean {
    // NOWPayments signs the JSON body with keys sorted alphabetically.
    let sortedPayload: string;
    try {
      sortedPayload = JSON.stringify(sortObject(JSON.parse(rawBody)));
    } catch {
      return false;
    }
    const computed = createHmac('sha512', secret).update(sortedPayload).digest('hex');
    try {
      return timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}

function sortObject(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj && typeof obj === 'object') {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObject((obj as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return obj;
}
