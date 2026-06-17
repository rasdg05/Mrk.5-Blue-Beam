import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatMXN } from '@/lib/money';
import { orderStatusLabel, paymentStatusLabel } from '@/lib/labels';
import { Badge, Card, Input } from '@/components/ui';
import { SubmitButton } from '@/components/submit-button';
import { markCompleted, markPayout, refundPayment } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      car: { include: { seller: true } },
      buyer: true,
      payments: { orderBy: { createdAt: 'desc' }, include: { refunds: true } },
      events: { orderBy: { createdAt: 'desc' } },
      reservation: true,
    },
  });
  if (!order) notFound();

  const buyerName = order.buyer?.name ?? order.guestName ?? '—';
  const buyerEmail = order.buyer?.email ?? order.guestEmail ?? '—';
  const buyerPhone = order.guestPhone ?? '—';
  const isThirdParty = order.car.ownership === 'THIRD_PARTY';

  return (
    <div>
      <Link
        href="/admin/ordenes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={15} /> Órdenes
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-xl font-bold text-slate-900">{order.orderNumber}</h1>
        <Badge tone={order.status === 'RESERVED' || order.status === 'PAID' ? 'green' : 'neutral'}>
          {orderStatusLabel[order.status]}
        </Badge>
        {order.amlFlag && (
          <Badge tone="amber">
            <ShieldAlert size={12} /> Supera umbral PLD — KYC requerido
          </Badge>
        )}
      </div>

      {sp.error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} /> {sp.error}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Summary */}
          <Card className="p-5">
            <Link href={`/autos/${order.carId}`} className="font-semibold text-brand-700 hover:underline">
              {order.car.title}
            </Link>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Cell label="Intención" value={order.intent === 'DEPOSIT' ? 'Seña' : 'Pago total'} />
              <Cell label="Cobrado online" value={formatMXN(order.amountDueMxn)} strong />
              <Cell label="Precio del auto" value={formatMXN(order.priceMxnSnapshot)} />
              <Cell label="Saldo offline" value={formatMXN(order.balanceDueMxn)} />
              <Cell label="Procedencia" value={isThirdParty ? 'Tercero' : 'Stock propio'} />
              <Cell
                label="Remisión vendedor"
                value={isThirdParty ? order.payoutStatus : 'N/A'}
              />
            </dl>
          </Card>

          {/* Buyer */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700">Comprador</h3>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <Cell label="Nombre" value={buyerName} />
              <Cell label="Email" value={buyerEmail} />
              <Cell label="WhatsApp" value={buyerPhone} />
            </dl>
          </Card>

          {/* Payments */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700">Pagos</h3>
            <div className="mt-3 space-y-3">
              {order.payments.map((p) => (
                <div key={p.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">
                      {p.provider} · {p.kind === 'DEPOSIT' ? 'Seña' : 'Total'}
                    </span>
                    <Badge tone={p.status === 'APPROVED' ? 'green' : p.status === 'REFUNDED' ? 'red' : 'amber'}>
                      {paymentStatusLabel[p.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-slate-500">
                    {formatMXN(p.amount)} {p.currency}
                    {p.providerRef ? ` · ref ${p.providerRef}` : ''}
                  </p>
                  {p.refunds.length > 0 && (
                    <p className="mt-1 text-xs text-red-600">
                      Reembolsado: {formatMXN(p.refundedAmount)}
                    </p>
                  )}
                  {p.status === 'APPROVED' && (
                    <form action={refundPayment} className="mt-2">
                      <input type="hidden" name="paymentId" value={p.id} />
                      <SubmitButton variant="danger" size="sm" pendingText="Reembolsando…">
                        Reembolsar total
                      </SubmitButton>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700">Actividad</h3>
            <ol className="mt-3 space-y-3">
              {order.events.map((e) => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-brand-400" />
                  <div>
                    <p className="text-slate-700">{e.message}</p>
                    <p className="text-xs text-slate-400">{e.createdAt.toLocaleString('es-MX')}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700">Acciones</h3>
            <div className="mt-3 space-y-3">
              {order.status === 'RESERVED' && (
                <form action={markCompleted}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <SubmitButton className="w-full" size="sm">
                    Marcar saldo liquidado / completar
                  </SubmitButton>
                </form>
              )}

              {isThirdParty && order.payoutStatus !== 'PAID' && (
                <form action={markPayout} className="space-y-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <Input name="payoutRef" placeholder="Referencia SPEI (opcional)" />
                  <SubmitButton variant="outline" size="sm" className="w-full">
                    Registrar remisión al vendedor
                  </SubmitButton>
                </form>
              )}

              {order.status !== 'RESERVED' && !(isThirdParty && order.payoutStatus !== 'PAID') && (
                <p className="text-xs text-slate-400">No hay acciones pendientes.</p>
              )}
            </div>
          </Card>

          {isThirdParty && order.car.seller && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-700">Vendedor</h3>
              <p className="mt-2 text-sm text-slate-700">{order.car.seller.name}</p>
              <p className="text-xs text-slate-500">{order.car.seller.email}</p>
              {order.car.seller.payoutClabe && (
                <p className="mt-1 text-xs text-slate-500">CLABE: {order.car.seller.payoutClabe}</p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className={strong ? 'font-semibold text-slate-900' : 'text-slate-700'}>{value}</dd>
    </div>
  );
}
