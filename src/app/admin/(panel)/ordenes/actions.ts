'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/session';
import { getPaymentProvider } from '@/lib/payments';
import { notifyBuyerRefund } from '@/lib/notifications';

/** Full refund of an order's payment (ADMIN+). Releases the car. */
export async function refundPayment(formData: FormData): Promise<void> {
  await requireAdmin('ADMIN');
  const paymentId = String(formData.get('paymentId'));
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: { include: { car: true, buyer: true } } },
  });
  if (!payment || !payment.providerRef) {
    redirect('/admin/ordenes');
  }

  try {
    const res = await getPaymentProvider(payment!.provider).refund({
      providerRef: payment!.providerRef!,
    });
    await prisma.$transaction([
      prisma.refund.create({
        data: {
          paymentId,
          amount: payment!.amount,
          status: 'COMPLETED',
          providerRefundRef: res.providerRefundRef ?? null,
        },
      }),
      prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED', refundedAmount: payment!.amount },
      }),
      prisma.order.update({ where: { id: payment!.orderId }, data: { status: 'REFUNDED' } }),
      prisma.car.updateMany({
        where: { id: payment!.order.carId, status: { in: ['RESERVED', 'SOLD'] } },
        data: { status: 'PUBLISHED', version: { increment: 1 } },
      }),
      prisma.reservation.updateMany({
        where: { orderId: payment!.orderId },
        data: { status: 'RELEASED', releasedAt: new Date() },
      }),
      prisma.orderEvent.create({
        data: {
          orderId: payment!.orderId,
          type: 'REFUNDED',
          message: 'Reembolso total emitido por admin.',
          actor: 'admin',
        },
      }),
    ]);

    const email = payment!.order.buyer?.email ?? payment!.order.guestEmail;
    if (email) {
      await notifyBuyerRefund({
        to: email,
        orderNumber: payment!.order.orderNumber,
        carTitle: payment!.order.car.title,
        amountDueCentavos: payment!.order.amountDueMxn,
        balanceDueCentavos: payment!.order.balanceDueMxn,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'refund error';
    redirect(`/admin/ordenes/${payment!.orderId}?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath(`/admin/ordenes/${payment!.orderId}`);
}

/** Mark a reserved order as completed (balance settled offline, title transferred). */
export async function markCompleted(formData: FormData): Promise<void> {
  await requireAdmin();
  const orderId = String(formData.get('orderId'));
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) redirect('/admin/ordenes');

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: 'COMPLETED' } }),
    prisma.car.update({ where: { id: order!.carId }, data: { status: 'SOLD' } }),
    prisma.reservation.updateMany({ where: { orderId }, data: { status: 'CONVERTED' } }),
    prisma.orderEvent.create({
      data: {
        orderId,
        type: 'COMPLETED',
        message: 'Saldo liquidado y operación completada (offline).',
        actor: 'admin',
      },
    }),
  ]);
  revalidatePath(`/admin/ordenes/${orderId}`);
}

/** Record that the third-party seller has been paid (remittance). */
export async function markPayout(formData: FormData): Promise<void> {
  await requireAdmin('ADMIN');
  const orderId = String(formData.get('orderId'));
  const payoutRef = String(formData.get('payoutRef') || '') || null;
  await prisma.order.update({
    where: { id: orderId },
    data: { payoutStatus: 'PAID', payoutRef },
  });
  await prisma.orderEvent.create({
    data: {
      orderId,
      type: 'PAYOUT_PAID',
      message: `Remisión al vendedor registrada${payoutRef ? ` (ref ${payoutRef})` : ''}.`,
      actor: 'admin',
    },
  });
  revalidatePath(`/admin/ordenes/${orderId}`);
}
