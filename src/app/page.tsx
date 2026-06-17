import Link from 'next/link';
import { BadgeCheck, Camera, FileCheck2, Wallet } from 'lucide-react';
import { getPublishedCars } from '@/lib/catalog';
import { CarCard } from '@/components/car-card';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { buttonClasses } from '@/components/ui';

export const dynamic = 'force-dynamic';

const STEPS = [
  { icon: FileCheck2, title: 'Verificación legal', text: 'Revisamos documentos y consultamos REPUVE vía Buró Vehicular.' },
  { icon: Camera, title: 'Fotografiado', text: 'Fotografiamos cada auto antes de publicarlo. Solo lo verificado entra al catálogo.' },
  { icon: Wallet, title: 'Reservá online', text: 'Apartá tu auto con una seña por Mercado Pago o crypto (stablecoins).' },
  { icon: BadgeCheck, title: 'Entrega segura', text: 'Coordinamos entrega, factura y cambio de propietario.' },
];

export default async function HomePage() {
  const featured = await getPublishedCars({ sort: 'recent' });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
              <BadgeCheck size={16} /> Autos verificados y fotografiados
            </span>
            <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Comprá tu próximo auto, <span className="text-brand-600">verificado</span> y con pago
              seguro
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Cada auto pasa revisión legal antes de publicarse. Reservá con seña por Mercado Pago o
              crypto, sin sorpresas.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/autos" className={buttonClasses('primary', 'lg')}>
                Ver catálogo
              </Link>
              <Link href="/vender" className={buttonClasses('outline', 'lg')}>
                Vender mi auto
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.title} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <s.icon size={20} />
                </div>
                <h3 className="mt-3 font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured catalog */}
        <section className="mx-auto max-w-6xl px-4 pb-4">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Últimos autos publicados</h2>
            <Link href="/autos" className="text-sm font-medium text-brand-600 hover:underline">
              Ver todos →
            </Link>
          </div>
          {featured.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              Aún no hay autos publicados. Volvé pronto.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 6).map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
