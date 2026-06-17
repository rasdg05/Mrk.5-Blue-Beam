import type { PaymentKind, PaymentMethodType, PaymentStatus } from '@prisma/client';

/**
 * Canonical payment vocabulary. The Prisma enums (PaymentStatus, PaymentKind,
 * PaymentMethodType) are the single source of truth — provider adapters map
 * their provider-specific strings into these, so nothing else in the app ever
 * sees a raw provider status.
 */
export type Currency = 'MXN' | 'USDC' | 'USDT';

export interface Money {
  /** Integer minor units (centavos for MXN; token minor units for crypto). */
  amount: number;
  currency: Currency;
}

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  kind: PaymentKind;
  amount: Money;
  description: string;
  buyer: { id?: string; email: string; name?: string; phone?: string };
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  notificationUrl: string;
  metadata: Record<string, string>;
  /** `${orderId}:${kind}` — one live intent per kind per order. */
  idempotencyKey: string;
}

export interface CreatePaymentResult {
  providerRef: string;
  checkoutUrl: string;
  status: PaymentStatus;
  raw: unknown;
}

export interface ProviderStatus {
  status: PaymentStatus;
  method?: PaymentMethodType;
  amountPaid?: Money;
  /** Provider's external reference (we set it to our orderId). */
  externalReference?: string;
  raw: unknown;
}

export interface WebhookParseResult {
  providerRef: string;
  /** Resolved from provider metadata / external_reference when available. */
  orderId?: string;
  /** Stable id used for inbound idempotency (WebhookEvent.eventId). */
  eventId: string;
  status: PaymentStatus;
  method?: PaymentMethodType;
  amountPaid?: Money;
  raw: unknown;
}

export interface RefundInput {
  providerRef: string;
  /** Omit for a full refund; include for a partial refund. */
  amount?: Money;
  reason?: string;
}

export interface RefundResult {
  status: PaymentStatus;
  providerRefundRef?: string;
  raw: unknown;
}
