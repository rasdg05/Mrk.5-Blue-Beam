import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatMXN } from '@/lib/money';
import { orderStatusLabel } from '@/lib/labels';
import { Badge, Card } from '@/components/ui';
import type { OrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const TONE: Record<OrderStatus, 'green' | 'amber' | 'neutral' | 'blue' | 'red'> = {
  RESERVED: 'green',
  PAID: 'green',
  COMPLETED: 'blue',
  AWAITING_PAYMENT: 'amber',
  CANCELLED: 'red',
  EXPIRED: 'neutral',
  REFUNDED: 'red',
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { car: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Órdenes</h1>
      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Orden</th>
              <th className="px-4 py-3 font-medium">Auto</th>
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  Aún no hay órdenes.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/ordenes/${o.id}`} className="font-mono text-xs font-medium text-brand-700 hover:underline">
                      {o.orderNumber}
                    </Link>
                    {o.amlFlag && (
                      <span className="ml-2 align-middle">
                        <Badge tone="amber">PLD</Badge>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{o.car.title}</td>
                  <td className="px-4 py-3 text-slate-700">{formatMXN(o.amountDueMxn)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={TONE[o.status]}>{orderStatusLabel[o.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {o.createdAt.toLocaleDateString('es-MX')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
