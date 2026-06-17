import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization');
  return header === `Bearer ${env.CRON_SECRET}`;
}

/**
 * Release soft-reserves whose unpaid checkout hold expired, returning the car to
 * PUBLISHED so abandoned checkouts don't lock inventory forever.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const expired = await prisma.reservation.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lt: now },
      order: { status: 'AWAITING_PAYMENT' },
    },
  });

  let released = 0;
  for (const r of expired) {
    await prisma.$transaction([
      prisma.reservation.update({
        where: { id: r.id },
        data: { status: 'RELEASED', releasedAt: now },
      }),
      prisma.car.updateMany({
        where: { id: r.carId, status: 'RESERVED' },
        data: { status: 'PUBLISHED', version: { increment: 1 } },
      }),
      prisma.order.update({ where: { id: r.orderId }, data: { status: 'EXPIRED' } }),
      prisma.orderEvent.create({
        data: { orderId: r.orderId, type: 'HOLD_EXPIRED', message: 'Hold vencido; auto liberado.' },
      }),
    ]);
    released += 1;
  }

  return NextResponse.json({ released });
}
