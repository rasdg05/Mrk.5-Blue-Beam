import type { PaymentProviderType } from '@prisma/client';
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  ProviderStatus,
  RefundInput,
  RefundResult,
  WebhookParseResult,
} from './types';

export interface IncomingWebhook {
  /** RAW request body — signature verification MUST use the raw bytes/string. */
  rawBody: string;
  headers: Headers;
  url: URL;
}

/**
 * The one internal payment interface. Orders/UI never call Mercado Pago or a
 * crypto gateway directly — only this. Add or swap providers by implementing it.
 */
export interface PaymentProvider {
  readonly id: PaymentProviderType;

  /** Create a hosted checkout for an order and return its redirect URL. */
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;

  /** Verify the webhook signature against the RAW body, then map to canonical. */
  parseAndVerifyWebhook(req: IncomingWebhook): Promise<WebhookParseResult>;

  /** Re-fetch the authoritative status from the provider (webhook = ping only). */
  getStatus(providerRef: string): Promise<ProviderStatus>;

  /** Full or partial refund. */
  refund(input: RefundInput): Promise<RefundResult>;
}
