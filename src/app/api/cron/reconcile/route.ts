import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { getPaymentProvider } from '@/lib/payments';
import { processPaymentEvent } from '@/lib/orders/process-payment-event';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(req: NextRequest): boolean {
  return req.headers.get('authorization') === `Bearer ${env.CRON_SECRET}`;
}

/**
 * Self-heal payments stuck in a non-final state by re-querying the provider —
 * defends against lost/missed webhooks (Mercado Pago does not resend) and crypto
 * confirmation delays.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 5 * 60_000); // older than 5 min
  const stale = await prisma.payment.findMany({
    where: {
      status: { in: ['PENDING', 'IN_PROCESS', 'CONFIRMING'] },
      providerRef: { not: null },
      createdAt: { lt: cutoff },
    },
    take: 50,
  });

  let reconciled = 0;
  const errors: string[] = [];
  for (const p of stale) {
    if (!p.providerRef) continue;
    try {
      const status = await getPaymentProvider(p.provider).getStatus(p.providerRef);
      const result = await processPaymentEvent({
        providerRef: p.providerRef,
        orderId: status.externalReference ?? p.orderId,
        eventId: `reconcile_${p.id}_${Date.now()}`,
        status: status.status,
        method: status.method,
        amountPaid: status.amountPaid,
        raw: status.raw,
      });
      if (result.applied) reconciled += 1;
    } catch (err) {
      errors.push(`${p.id}: ${err instanceof Error ? err.message : 'error'}`);
    }
  }

  return NextResponse.json({ checked: stale.length, reconciled, errors });
}
