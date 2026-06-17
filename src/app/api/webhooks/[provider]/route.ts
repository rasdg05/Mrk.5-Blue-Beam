import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getProviderBySlug } from '@/lib/payments';
import { processPaymentEvent } from '@/lib/orders/process-payment-event';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Payment webhook receiver.
 * 1. Verify the signature against the RAW body.
 * 2. Persist the event (idempotent by provider+eventId).
 * 3. Process it (state machine) and ack 200 fast. The reconcile cron is the
 *    safety net if processing fails (Mercado Pago does not resend on non-200).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  const { provider: slug } = await params;
  const provider = getProviderBySlug(slug);
  if (!provider) {
    return NextResponse.json({ error: 'unknown provider' }, { status: 404 });
  }

  const rawBody = await req.text();
  const url = new URL(req.url);

  let parsed;
  try {
    parsed = await provider.parseAndVerifyWebhook({ rawBody, headers: req.headers, url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'parse error';
    if (msg.toLowerCase().includes('signature')) {
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
    }
    // Non-actionable notification (e.g. non-payment topic) — ack so it isn't retried.
    return NextResponse.json({ ignored: msg }, { status: 200 });
  }

  // Inbound idempotency.
  const eventRow = await prisma.webhookEvent.upsert({
    where: { provider_eventId: { provider: provider.id, eventId: parsed.eventId } },
    create: {
      provider: provider.id,
      eventId: parsed.eventId,
      providerRef: parsed.providerRef,
      payload: (parsed.raw ?? {}) as Prisma.InputJsonValue,
    },
    update: {},
  });

  if (eventRow.processedAt) {
    return NextResponse.json({ duplicate: true }, { status: 200 });
  }

  try {
    const result = await processPaymentEvent(parsed);
    await prisma.webhookEvent.update({
      where: { id: eventRow.id },
      data: { processedAt: new Date(), error: result.applied ? null : (result.reason ?? null) },
    });
  } catch (err) {
    await prisma.webhookEvent.update({
      where: { id: eventRow.id },
      data: { error: err instanceof Error ? err.message : 'process error' },
    });
    // Intentionally still 200 — reconcile cron will retry.
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
