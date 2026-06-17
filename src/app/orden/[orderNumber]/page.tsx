import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatMXN } from '@/lib/money';
import { orderStatusLabel, paymentStatusLabel } from '@/lib/labels';
import { Badge, Card } from '@/components/ui';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const metadata: Metadata = { title: 'Estado de tu orden' };
export const dynamic = 'force-dynamic';

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      car: true,
      payments: { orderBy: { createdAt: 'desc' } },
      events: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!order) notFound();

  const paid = order.status === 'RESERVED' || order.status === 'PAID' || order.status === 'COMPLETED';
  const failed = order.status === 'CANCELLED' || order.status === 'EXPIRED';
  const Icon = paid ? CheckCircle2 : failed ? XCircle : Clock;
  const tone = paid ? 'text-emerald-600' : failed ? 'text-red-600' : 'text-amber-600';

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Icon className={tone} size={32} />
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {paid
                  ? '¡Listo! Tu orden está confirmada'
                  : failed
                    ? 'Orden no completada'
                    : 'Estamos procesando tu pago'}
              </h1>
              <p className="text-sm text-slate-500">
                Orden <span className="font-mono font-medium">{order.orderNumber}</span> ·{' '}
                {orderStatusLabel[order.status]}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 p-4">
            <Link href={`/autos/${order.carId}`} className="font-semibold text-brand-700 hover:underline">
              {order.car.title}
            </Link>
            <dl className="mt-3 space-y-1 text-sm">
              <Row label={order.intent === 'DEPOSIT' ? 'Seña pagada' : 'Total'} value={formatMXN(order.amountDueMxn)} strong />
              {order.balanceDueMxn > 0 && (
                <Row label="Saldo a liquidar (offline)" value={formatMXN(order.balanceDueMxn)} />
              )}
              <Row label="Precio del auto" value={formatMXN(order.priceMxnSnapshot)} />
            </dl>
          </div>

          {order.payments[0] && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">Estado del pago</span>
              <Badge tone={order.payments[0].status === 'APPROVED' ? 'green' : 'amber'}>
                {paymentStatusLabel[order.payments[0].status]}
              </Badge>
            </div>
          )}

          {/* Timeline */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-900">Actividad</h2>
            <ol className="mt-3 space-y-3">
              {order.events.map((e) => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-brand-400" />
                  <div>
                    <p className="text-slate-700">{e.message}</p>
                    <p className="text-xs text-slate-400">
                      {e.createdAt.toLocaleString('es-MX')}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Card>

        <p className="mt-4 text-center text-sm text-slate-500">
          ¿Dudas? Escribinos y mencioná tu número de orden.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className={strong ? 'font-semibold text-slate-900' : 'text-slate-700'}>{value}</dd>
    </div>
  );
}
