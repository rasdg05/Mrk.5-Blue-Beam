import Image from 'next/image';
import Link from 'next/link';
import { Gauge } from 'lucide-react';
import { formatMXN } from '@/lib/money';
import { transmissionLabel, kmLabel } from '@/lib/labels';
import { Badge } from '@/components/ui';
import type { CatalogCar } from '@/lib/catalog';

export function CarCard({ car }: { car: CatalogCar }) {
  const cover = car.photos[0]?.url;
  return (
    <Link
      href={`/autos/${car.id}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {cover ? (
          <Image
            src={cover}
            alt={car.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Gauge size={40} />
          </div>
        )}
        {car.status === 'RESERVED' && (
          <div className="absolute left-2 top-2">
            <Badge tone="amber">Reservado</Badge>
          </div>
        )}
        {car.repuveStatus === 'CLEAR' && (
          <div className="absolute right-2 top-2">
            <Badge tone="green">REPUVE OK</Badge>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold text-slate-900">{car.title}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {car.year} · {kmLabel(car.mileageKm)} · {transmissionLabel[car.transmission]}
        </p>
        <p className="mt-3 text-lg font-bold text-slate-900">{formatMXN(car.priceMxn)}</p>
      </div>
    </Link>
  );
}
