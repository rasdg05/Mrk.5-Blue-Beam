import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Fuel,
  Gauge,
  MapPin,
  Palette,
  ShieldCheck,
  Settings2,
} from 'lucide-react';
import { getPublicCar } from '@/lib/catalog';
import { computeDepositCentavos, formatMXN } from '@/lib/money';
import { fuelLabel, kmLabel, transmissionLabel } from '@/lib/labels';
import { Badge, Card } from '@/components/ui';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Gallery } from './gallery';
import { CheckoutForm } from './checkout-form';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const car = await getPublicCar(id);
  return { title: car ? car.title : 'Auto no encontrado' };
}

export default async function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const car = await getPublicCar(id);
  if (!car) notFound();

  const available = car.status === 'PUBLISHED';
  const deposit = computeDepositCentavos(car.priceMxn, car.depositType, car.depositValue);
  const payAmount = car.paymentMode === 'DEPOSIT' ? deposit : car.priceMxn;

  const specs = [
    { icon: CalendarDays, label: 'Año', value: String(car.year) },
    { icon: Gauge, label: 'Kilometraje', value: kmLabel(car.mileageKm) },
    { icon: Settings2, label: 'Transmisión', value: transmissionLabel[car.transmission] },
    { icon: Fuel, label: 'Combustible', value: fuelLabel[car.fuel] },
    ...(car.color ? [{ icon: Palette, label: 'Color', value: car.color }] : []),
    ...(car.locationCity
      ? [{ icon: MapPin, label: 'Ubicación', value: `${car.locationCity}, ${car.locationState ?? ''}` }]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <nav className="mb-5 flex items-center gap-1.5 text-sm text-slate-500">
          <Link href="/" className="transition-colors hover:text-slate-700">
            Inicio
          </Link>
          <ChevronRight size={14} className="text-slate-400" />
          <Link href="/autos" className="transition-colors hover:text-slate-700">
            Catálogo
          </Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="truncate font-medium text-slate-700">{car.title}</span>
        </nav>
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left: gallery + specs */}
          <div>
            <Gallery photos={car.photos} title={car.title} />

            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{car.title}</h1>
                {car.repuveStatus === 'CLEAR' && <Badge tone="green">REPUVE sin reporte</Badge>}
                {car.legalCheckStatus === 'APPROVED' && (
                  <Badge tone="blue">
                    <ShieldCheck size={12} /> Revisión legal OK
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {car.brand.name} {car.model.name} {car.trim ?? ''}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {specs.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-slate-200 bg-white p-3 transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2 text-slate-500">
                    <s.icon size={15} className="text-brand-600" />
                    <span className="text-xs">{s.label}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{s.value}</p>
                </div>
              ))}
            </div>

            {car.description && (
              <div className="mt-6">
                <h2 className="font-semibold text-slate-900">Descripción</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{car.description}</p>
              </div>
            )}

            {car.features.length > 0 && (
              <div className="mt-6">
                <h2 className="font-semibold text-slate-900">Equipamiento</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {car.features.map((f) => (
                    <Badge key={f.id}>{f.label}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: purchase card */}
          <div>
            <Card className="sticky top-20 p-5">
              <p className="text-sm text-slate-500">Precio</p>
              <p className="text-3xl font-extrabold text-slate-900">{formatMXN(car.priceMxn)}</p>

              {car.paymentMode === 'DEPOSIT' && (
                <div className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
                  Resérvalo con un anticipo de <strong>{formatMXN(deposit)}</strong>. El resto se
                  liquida al concretar la operación.
                </div>
              )}

              <div className="mt-5">
                {available ? (
                  <CheckoutForm
                    carId={car.id}
                    mode={car.paymentMode}
                    payLabel={formatMXN(payAmount)}
                    acceptsMercadoPago={car.acceptsMercadoPago}
                    acceptsCrypto={car.acceptsCrypto}
                  />
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
                    {car.status === 'RESERVED'
                      ? 'Este auto está reservado por otra persona.'
                      : 'Este auto ya fue vendido.'}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <BadgeCheck size={14} className="text-emerald-600" />
                Auto verificado y fotografiado por Autos MX
              </div>
            </Card>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
