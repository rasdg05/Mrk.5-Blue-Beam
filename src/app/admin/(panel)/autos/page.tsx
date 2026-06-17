import Link from 'next/link';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatMXN } from '@/lib/money';
import { carStatusLabel } from '@/lib/labels';
import { Badge, Card, buttonClasses } from '@/components/ui';
import type { CarStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const STATUS_TONE: Record<CarStatus, 'green' | 'amber' | 'neutral' | 'blue' | 'red'> = {
  PUBLISHED: 'green',
  RESERVED: 'amber',
  SOLD: 'blue',
  DRAFT: 'neutral',
  SUBMITTED: 'amber',
  ARCHIVED: 'red',
};

export default async function AdminCarsPage() {
  const cars = await prisma.car.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { brand: true, model: true, _count: { select: { photos: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Autos</h1>
        <Link href="/admin/autos/nuevo" className={buttonClasses('primary', 'md')}>
          <Plus size={16} /> Nuevo auto
        </Link>
      </div>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Auto</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Fotos</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cars.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  Todavía no hay autos. Crea el primero.
                </td>
              </tr>
            ) : (
              cars.map((car) => (
                <tr key={car.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/autos/${car.id}`} className="font-medium text-brand-700 hover:underline">
                      {car.title}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {car.brand.name} {car.model.name} · {car.year}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatMXN(car.priceMxn)}</td>
                  <td className="px-4 py-3 text-slate-500">{car._count.photos}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[car.status]}>{carStatusLabel[car.status]}</Badge>
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
