import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Gauge } from 'lucide-react';
import { formatMXN } from '@/lib/money';
import { transmissionLabel, kmLabel } from '@/lib/labels';
import { Badge } from '@/components/ui';
import type { CatalogCar } from '@/lib/catalog';

export function CarCard({ car }: { car: CatalogCar }) {
  const cover = car.photos[0]?.url;
  return (
    <Link
      href={`/autos/${car.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {cover ? (
          <Image
            src={cover}
            alt={car.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Gauge size={40} />
          </div>
        )}
        {/* subtle top scrim so corner badges stay legible over bright photos */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {car.status === 'RESERVED' && (
          <div className="absolute left-2.5 top-2.5">
            <Badge tone="amber">Reservado</Badge>
          </div>
        )}
        {car.repuveStatus === 'CLEAR' && (
          <div className="absolute right-2.5 top-2.5">
            <Badge tone="green">REPUVE OK</Badge>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold text-slate-900">{car.title}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {car.year} · {kmLabel(car.mileageKm)} · {transmissionLabel[car.transmission]}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-lg font-bold text-slate-900">{formatMXN(car.priceMxn)}</p>
          <span className="flex -translate-x-1 items-center gap-1 text-sm font-medium text-brand-600 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            Ver <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}
