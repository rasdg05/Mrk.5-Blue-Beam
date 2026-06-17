import { Prisma, type PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { DEPOSIT_RESERVATION_HOURS } from '@/lib/compliance';
import {
  notifyAdmin,
  notifyBuyerPaid,
  notifyBuyerPaymentFailed,
  notifyBuyerRefund,
  notifyBuyerReservation,
} from '@/lib/notifications';
import type { WebhookParseResult } from '@/lib/payments/types';

/**
 * Decide whether an incoming canonical status should be applied over the
 * current one. Forward-only, with refunds the only transition allowed after
 * APPROVED. Terminal states are not re-opened. This makes webhook reprocessing
 * (duplicates, out-of-order pings) safe.
 */
function shouldApply(current: PaymentStatus, incoming: PaymentStatus): boolean {
  if (current === incoming) return false;
  if (current === 'APPROVED') {
    return incoming === 'REFUNDED' || incoming === 'PARTIALLY_REFUNDED';
  }
  if (
    current === 'REFUNDED' ||
    current === 'REJECTED' ||
    current === 'CANCELLED' ||
    current === 'EXPIRED'
  ) {
    return false; // terminal
  }
  return true;
}

export interface ProcessResult {
  applied: boolean;
  reason?: string;
}

/**
 * Apply a parsed webhook event to the order/payment/car atomically and send
 * notifications afterwards. Idempotent and concurrency-safe.
 */
export async function processPaymentEvent(event: WebhookParseResult): Promise<ProcessResult> {
  // Resolve the payment: by orderId (Mercado Pago external_reference) or by
  // providerRef (crypto stable invoice id).
  const payment = await prisma.payment.findFirst({
    where: event.orderId
      ? { orderId: event.orderId }
      : { providerRef: event.providerRef },
    orderBy: { createdAt: 'desc' },
    include: { order: { include: { car: true, buyer: true } } },
  });

  if (!payment) {
    return { applied: false, reason: 'payment_not_found' };
  }

  if (!shouldApply(payment.status, event.status)) {
    return { applied: false, reason: `no_transition(${payment.status}->${event.status})` };
  }

  const order = payment.order;
  const buyerEmail = order.buyer?.email ?? order.guestEmail ?? undefined;
  const emailCtx = {
    to: buyerEmail ?? '',
    orderNumber: order.orderNumber,
    carTitle: order.car.title,
    amountDueCentavos: order.amountDueMxn,
    balanceDueCentavos: order.balanceDueMxn,
  };

  let notify: (() => Promise<void>) | null = null;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: event.status,
        method: event.method ?? payment.method,
        providerRef: event.providerRef || payment.providerRef,
        amountPaid: event.amountPaid?.amount ?? payment.amountPaid,
        rawLatest: (event.raw ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });

    if (event.status === 'APPROVED') {
      if (payment.kind === 'DEPOSIT') {
        await tx.order.update({ where: { id: order.id }, data: { status: 'RESERVED' } });
        await tx.car.updateMany({
          where: { id: order.carId, status: 'RESERVED' },
          data: { status: 'RESERVED' },
        });
        await tx.reservation.updateMany({
          where: { orderId: order.id, status: 'ACTIVE' },
          data: { expiresAt: new Date(Date.now() + DEPOSIT_RESERVATION_HOURS * 3_600_000) },
        });
        await event_(tx, order.id, 'DEPOSIT_PAID', 'Seña pagada; auto reservado.');
        notify = async () => {
          if (buyerEmail) await notifyBuyerReservation(emailCtx);
          await notifyAdmin(
            `Nueva reserva ${order.orderNumber}`,
            `Seña pagada por ${order.car.title}.`,
          );
        };
      } else {
        await tx.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
        await tx.car.update({ where: { id: order.carId }, data: { status: 'SOLD' } });
        await tx.reservation.updateMany({
          where: { orderId: order.id },
          data: { status: 'CONVERTED' },
        });
        await event_(tx, order.id, 'PAID', 'Pago total confirmado; auto vendido.');
        notify = async () => {
          if (buyerEmail) await notifyBuyerPaid(emailCtx);
          await notifyAdmin(`Venta ${order.orderNumber}`, `Pago total por ${order.car.title}.`);
        };
      }
    } else if (
      event.status === 'REJECTED' ||
      event.status === 'CANCELLED' ||
      event.status === 'EXPIRED'
    ) {
      await tx.order.update({
        where: { id: order.id },
        data: { status: event.status === 'EXPIRED' ? 'EXPIRED' : 'CANCELLED' },
      });
      await tx.car.updateMany({
        where: { id: order.carId, status: 'RESERVED' },
        data: { status: 'PUBLISHED', version: { increment: 1 } },
      });
      await tx.reservation.updateMany({
        where: { orderId: order.id, status: 'ACTIVE' },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });
      await event_(tx, order.id, 'PAYMENT_FAILED', `Pago ${event.status}; auto liberado.`);
      notify = async () => {
        if (buyerEmail) await notifyBuyerPaymentFailed(emailCtx);
      };
    } else if (event.status === 'REFUNDED') {
      await tx.order.update({ where: { id: order.id }, data: { status: 'REFUNDED' } });
      await tx.car.updateMany({
        where: { id: order.carId, status: { in: ['RESERVED', 'SOLD'] } },
        data: { status: 'PUBLISHED', version: { increment: 1 } },
      });
      await tx.reservation.updateMany({
        where: { orderId: order.id },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });
      await event_(tx, order.id, 'REFUNDED', 'Pago reembolsado; auto liberado.');
      notify = async () => {
        if (buyerEmail) await notifyBuyerRefund(emailCtx);
      };
    } else if (event.status === 'UNDERPAID' || event.status === 'OVERPAID') {
      // Crypto edge case — needs manual review, do not mark sold.
      await event_(
        tx,
        order.id,
        event.status,
        `Pago en crypto ${event.status}; requiere revisión manual.`,
      );
      notify = async () => {
        await notifyAdmin(
          `Revisar pago ${order.orderNumber}`,
          `Pago en crypto marcado ${event.status} para ${order.car.title}.`,
        );
      };
    } else {
      // PENDING / IN_PROCESS / CONFIRMING — just record progress.
      await event_(tx, order.id, 'PAYMENT_UPDATE', `Estado de pago: ${event.status}.`);
    }
  });

  if (notify) {
    await (notify as () => Promise<void>)();
  }

  return { applied: true };
}

async function event_(
  tx: Prisma.TransactionClient,
  orderId: string,
  type: string,
  message: string,
): Promise<void> {
  await tx.orderEvent.create({ data: { orderId, type, message } });
}
