import Link from 'next/link';
import { ArrowRight, BadgeCheck, Camera, FileCheck2, ShieldCheck, Wallet } from 'lucide-react';
import { getPublishedCars } from '@/lib/catalog';
import { CarCard } from '@/components/car-card';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Reveal } from '@/components/reveal';
import { buttonClasses } from '@/components/ui';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const STEPS = [
  { icon: FileCheck2, title: 'Verificación legal', text: 'Revisamos documentos y consultamos REPUVE vía Buró Vehicular.' },
  { icon: Camera, title: 'Fotografiado', text: 'Fotografiamos cada auto antes de publicarlo. Solo lo verificado entra al catálogo.' },
  { icon: Wallet, title: 'Reserva online', text: 'Aparta tu auto con un anticipo por Mercado Pago o crypto (stablecoins).' },
  { icon: BadgeCheck, title: 'Entrega segura', text: 'Coordinamos entrega, factura y cambio de propietario.' },
];

const TRUST = [
  { icon: ShieldCheck, label: 'Revisión legal + REPUVE' },
  { icon: Wallet, label: 'Pago seguro: MP o crypto' },
  { icon: BadgeCheck, label: 'Fotografiado y verificado' },
];

export default async function HomePage() {
  const featured = await getPublishedCars({ sort: 'recent' });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-200">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-50/70 via-white to-slate-50" />
            <div className="absolute left-1/2 top-[-15%] h-[460px] w-[860px] max-w-[120vw] -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(15_23_42/0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgb(15_23_42/0.045)_1px,transparent_1px)] bg-[size:46px_46px] [-webkit-mask-image:radial-gradient(ellipse_60%_55%_at_50%_0%,#000_55%,transparent_100%)] [mask-image:radial-gradient(ellipse_60%_55%_at_50%_0%,#000_55%,transparent_100%)]" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
            <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-brand-100 bg-brand-50/80 px-3 py-1 text-sm font-medium text-brand-700 backdrop-blur">
              <BadgeCheck size={16} /> Autos verificados y fotografiados
            </span>
            <h1
              style={{ animationDelay: '90ms' }}
              className="mx-auto mt-6 max-w-3xl animate-fade-up text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl"
            >
              Compra tu próximo auto,{' '}
              <span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
                verificado
              </span>{' '}
              y con pago seguro
            </h1>
            <p
              style={{ animationDelay: '170ms' }}
              className="mx-auto mt-5 max-w-2xl animate-fade-up text-pretty text-lg text-slate-600"
            >
              Cada auto pasa revisión legal antes de publicarse. Reserva con un anticipo por Mercado
              Pago o crypto, sin sorpresas.
            </p>
            <div
              style={{ animationDelay: '250ms' }}
              className="mt-9 flex animate-fade-up flex-col justify-center gap-3 sm:flex-row"
            >
              <Link href="/autos" className={cn(buttonClasses('primary', 'lg'), 'group')}>
                Ver catálogo
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <Link href="/vender" className={buttonClasses('outline', 'lg')}>
                Vender mi auto
              </Link>
            </div>
            <div
              style={{ animationDelay: '330ms' }}
              className="mt-10 flex animate-fade-up flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500"
            >
              {TRUST.map((t) => (
                <span key={t.label} className="inline-flex items-center gap-1.5">
                  <t.icon size={16} className="text-brand-600" /> {t.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Cómo funciona
            </h2>
            <p className="mt-2 text-slate-600">
              Del catálogo a tu cochera, sin sorpresas ni letras chiquitas.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <div className="group h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                    <s.icon size={20} />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Featured catalog */}
        <section className="mx-auto max-w-6xl px-4 pb-8">
          <Reveal className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Últimos autos publicados
            </h2>
            <Link
              href="/autos"
              className="group inline-flex flex-shrink-0 items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Ver todos
              <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
          {featured.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              Aún no hay autos publicados. Vuelve pronto.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 6).map((car, i) => (
                <Reveal key={car.id} delay={(i % 3) * 80}>
                  <CarCard car={car} />
                </Reveal>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
