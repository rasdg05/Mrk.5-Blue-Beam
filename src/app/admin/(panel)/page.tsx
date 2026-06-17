import Link from 'next/link';
import { Car, Clock, ShoppingCart, Users } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatMXN } from '@/lib/money';
import { orderStatusLabel } from '@/lib/labels';
import { Badge, Card } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [published, draft, reserved, awaitingOrders, sellersPending, recentOrders, soldAgg] =
    await Promise.all([
      prisma.car.count({ where: { status: 'PUBLISHED' } }),
      prisma.car.count({ where: { status: { in: ['DRAFT', 'SUBMITTED'] } } }),
      prisma.car.count({ where: { status: 'RESERVED' } }),
      prisma.order.count({ where: { status: 'AWAITING_PAYMENT' } }),
      prisma.seller.count({ where: { kyc: { status: 'PENDING' } } }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { car: true },
      }),
      prisma.order.aggregate({
        _sum: { amountDueMxn: true },
        where: { status: { in: ['RESERVED', 'PAID', 'COMPLETED'] } },
      }),
    ]);

  const stats = [
    { label: 'Publicados', value: published, icon: Car, href: '/admin/autos' },
    { label: 'Borradores / por revisar', value: draft, icon: Clock, href: '/admin/autos' },
    { label: 'Reservados', value: reserved, icon: ShoppingCart, href: '/admin/autos' },
    { label: 'Vendedores por verificar', value: sellersPending, icon: Users, href: '/admin/vendedores' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Cobrado (seña + pagos): <strong>{formatMXN(soldAgg._sum.amountDueMxn ?? 0)}</strong> ·{' '}
        {awaitingOrders} órdenes esperando pago
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="p-5 transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <s.icon className="text-brand-600" size={20} />
                <span className="text-2xl font-bold text-slate-900">{s.value}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{s.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Órdenes recientes</h2>
          <Link href="/admin/ordenes" className="text-sm text-brand-600 hover:underline">
            Ver todas →
          </Link>
        </div>
        <Card className="divide-y divide-slate-100">
          {recentOrders.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">Aún no hay órdenes.</p>
          ) : (
            recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/ordenes/${o.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{o.car.title}</p>
                  <p className="font-mono text-xs text-slate-400">{o.orderNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">{formatMXN(o.amountDueMxn)}</span>
                  <Badge tone={o.status === 'RESERVED' || o.status === 'PAID' ? 'green' : 'neutral'}>
                    {orderStatusLabel[o.status]}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
