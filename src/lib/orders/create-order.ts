import { Prisma, type CarStatus, type CarOwnership, type PaymentMode, type DepositType } from '@prisma/client';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { computeDepositCentavos } from '@/lib/money';
import { isAmlFlagged, SOFT_HOLD_MINUTES } from '@/lib/compliance';
import { generateOrderNumber } from '@/lib/utils';
import { getPaymentProvider } from '@/lib/payments';

export type OrderErrorCode =
  | 'CAR_NOT_FOUND'
  | 'CAR_NOT_AVAILABLE'
  | 'METHOD_NOT_ACCEPTED'
  | 'INVALID_DEPOSIT_CONFIG'
  | 'THIRD_PARTY_FULL_NOT_ALLOWED'
  | 'PROVIDER_ERROR';

export class OrderError extends Error {
  constructor(
    public code: OrderErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'OrderError';
  }
}

export interface CreateOrderInput {
  carId: string;
  method: 'mercadopago' | 'crypto';
  buyer: { email: string; name?: string; phone?: string; userId?: string };
}

export interface CreateOrderResult {
  orderId: string;
  orderNumber: string;
  checkoutUrl: string;
}

interface LockedCar {
  id: string;
  title: string;
  status: CarStatus;
  priceMxn: number;
  paymentMode: PaymentMode;
  depositType: DepositType | null;
  depositValue: number | null;
  ownership: CarOwnership;
  acceptsMercadoPago: boolean;
  acceptsCrypto: boolean;
}

function providerFor(method: 'mercadopago' | 'crypto') {
  if (method === 'mercadopago') return { type: 'MERCADOPAGO' as const, slug: 'mercadopago' };
  return env.CRYPTO_PROVIDER === 'bitso'
    ? { type: 'BITSO' as const, slug: 'bitso' }
    : { type: 'NOWPAYMENTS' as const, slug: 'nowpayments' };
}

/**
 * Create an order + a PENDING payment and a hosted checkout.
 *
 * Concurrency: the car row is locked with SELECT ... FOR UPDATE inside the
 * transaction and re-checked as PUBLISHED, so two buyers cannot both pass the
 * availability check (the second blocks, then sees RESERVED and is rejected).
 * The external provider call happens OUTSIDE the transaction to avoid holding
 * the row lock across the network.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const provider = providerFor(input.method);

  // --- Transaction A: lock the car, compute amounts server-side, soft-reserve ---
  const created = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<LockedCar[]>`
      SELECT id, title, status, "priceMxn", "paymentMode", "depositType", "depositValue",
             ownership, "acceptsMercadoPago", "acceptsCrypto"
      FROM "Car"
      WHERE id = ${input.carId}
      FOR UPDATE`;

    const car = rows[0];
    if (!car) throw new OrderError('CAR_NOT_FOUND');
    if (car.status !== 'PUBLISHED') throw new OrderError('CAR_NOT_AVAILABLE');

    if (input.method === 'mercadopago' && !car.acceptsMercadoPago) {
      throw new OrderError('METHOD_NOT_ACCEPTED', 'Este auto no acepta Mercado Pago');
    }
    if (input.method === 'crypto' && !car.acceptsCrypto) {
      throw new OrderError('METHOD_NOT_ACCEPTED', 'Este auto no acepta crypto');
    }

    // Phase 1 compliance guard: third-party cars can only take a DEPOSIT online.
    if (car.ownership === 'THIRD_PARTY' && car.paymentMode === 'FULL') {
      throw new OrderError(
        'THIRD_PARTY_FULL_NOT_ALLOWED',
        'Los autos de terceros solo admiten seña en línea (Fase 1)',
      );
    }

    const intent = car.paymentMode; // DEPOSIT | FULL
    let amountDue: number;
    let balanceDue: number;
    let depositSnapshot: number | null;

    if (intent === 'DEPOSIT') {
      const deposit = computeDepositCentavos(car.priceMxn, car.depositType, car.depositValue);
      if (deposit <= 0) throw new OrderError('INVALID_DEPOSIT_CONFIG');
      amountDue = deposit;
      balanceDue = car.priceMxn - deposit;
      depositSnapshot = deposit;
    } else {
      amountDue = car.priceMxn;
      balanceDue = 0;
      depositSnapshot = null;
    }

    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        carId: car.id,
        buyerUserId: input.buyer.userId ?? null,
        guestEmail: input.buyer.userId ? null : input.buyer.email,
        guestName: input.buyer.userId ? null : (input.buyer.name ?? null),
        guestPhone: input.buyer.userId ? null : (input.buyer.phone ?? null),
        intent,
        priceMxnSnapshot: car.priceMxn,
        depositMxnSnapshot: depositSnapshot,
        amountDueMxn: amountDue,
        balanceDueMxn: balanceDue,
        status: 'AWAITING_PAYMENT',
        amlFlag: isAmlFlagged(car.priceMxn),
        payoutStatus: car.ownership === 'THIRD_PARTY' ? 'PENDING' : 'NONE',
      },
    });

    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        provider: provider.type,
        kind: intent,
        amount: amountDue,
        currency: 'MXN',
        status: 'PENDING',
        idempotencyKey: `${order.id}:${intent}`,
      },
    });

    // Soft-reserve to prevent double-sell; bump optimistic-lock version.
    await tx.car.update({
      where: { id: car.id },
      data: { status: 'RESERVED', version: { increment: 1 } },
    });

    await tx.reservation.create({
      data: {
        orderId: order.id,
        carId: car.id,
        expiresAt: new Date(Date.now() + SOFT_HOLD_MINUTES * 60_000),
        status: 'ACTIVE',
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: 'ORDER_CREATED',
        message: `Orden creada (${intent}) por ${formatAmount(amountDue)}.`,
      },
    });

    return { order, payment, carTitle: car.title, amountDue, intent };
  });

  // --- External provider call (outside the transaction) ---
  try {
    const result = await getPaymentProvider(provider.type).createPayment({
      orderId: created.order.id,
      orderNumber: created.order.orderNumber,
      kind: created.intent,
      amount: { amount: created.amountDue, currency: 'MXN' },
      description: `${created.intent === 'DEPOSIT' ? 'Seña' : 'Pago'} — ${created.carTitle}`,
      buyer: {
        id: input.buyer.userId,
        email: input.buyer.email,
        name: input.buyer.name,
        phone: input.buyer.phone,
      },
      successUrl: `${env.APP_URL}/orden/${created.order.orderNumber}?status=success`,
      failureUrl: `${env.APP_URL}/orden/${created.order.orderNumber}?status=failure`,
      pendingUrl: `${env.APP_URL}/orden/${created.order.orderNumber}?status=pending`,
      notificationUrl: `${env.APP_URL}/api/webhooks/${provider.slug}`,
      metadata: { carId: created.order.carId, orderId: created.order.id },
      idempotencyKey: created.payment.idempotencyKey,
    });

    await prisma.payment.update({
      where: { id: created.payment.id },
      data: {
        providerRef: result.providerRef,
        checkoutUrl: result.checkoutUrl,
        rawCreate: result.raw as Prisma.InputJsonValue,
      },
    });

    return {
      orderId: created.order.id,
      orderNumber: created.order.orderNumber,
      checkoutUrl: result.checkoutUrl,
    };
  } catch (err) {
    // Roll the inventory forward-safe: cancel the order and release the car.
    await releaseFailedOrder(created.order.id, created.order.carId);
    throw new OrderError('PROVIDER_ERROR', err instanceof Error ? err.message : 'Provider error');
  }
}

async function releaseFailedOrder(orderId: string, carId: string): Promise<void> {
  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } }),
    prisma.car.updateMany({
      where: { id: carId, status: 'RESERVED' },
      data: { status: 'PUBLISHED', version: { increment: 1 } },
    }),
    prisma.reservation.updateMany({
      where: { orderId, status: 'ACTIVE' },
      data: { status: 'RELEASED', releasedAt: new Date() },
    }),
    prisma.orderEvent.create({
      data: {
        orderId,
        type: 'CHECKOUT_FAILED',
        message: 'No se pudo iniciar el checkout; orden cancelada y auto liberado.',
      },
    }),
  ]);
}

function formatAmount(centavos: number): string {
  return `$${(centavos / 100).toLocaleString('es-MX')}`;
}
