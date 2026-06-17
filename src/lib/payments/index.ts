import type { PaymentProviderType } from '@prisma/client';
import { MercadoPagoProvider } from './mercadopago';
import { NowPaymentsProvider } from './nowpayments';
import type { PaymentProvider } from './provider';

export type { PaymentProvider, IncomingWebhook } from './provider';
export * from './types';

const mercadopago = new MercadoPagoProvider();
const nowpayments = new NowPaymentsProvider();

/** Map the public webhook path segment to a provider. */
const BY_SLUG: Record<string, PaymentProvider> = {
  mercadopago,
  nowpayments,
};

export function getPaymentProvider(provider: PaymentProviderType): PaymentProvider {
  switch (provider) {
    case 'MERCADOPAGO':
      return mercadopago;
    case 'NOWPAYMENTS':
      return nowpayments;
    case 'BITSO':
      throw new Error('Bitso provider is not implemented yet (Phase 2).');
    default:
      throw new Error(`Unknown payment provider: ${provider as string}`);
  }
}

export function getProviderBySlug(slug: string): PaymentProvider | null {
  return BY_SLUG[slug] ?? null;
}
