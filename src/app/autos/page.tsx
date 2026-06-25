import type { Metadata } from 'next';
import { getBrandsWithPublished, getPublishedCars, type CatalogSort } from '@/lib/catalog';
import { pesosToCentavos } from '@/lib/money';
import { CarCard } from '@/components/car-card';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Reveal } from '@/components/reveal';
import { Button, Field, Input, Select } from '@/components/ui';
import type { TransmissionType } from '@prisma/client';

export const metadata: Metadata = { title: 'Catálogo de autos' };
export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}
function num(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const brandSlug = str(sp.brand);
  const transmission = str(sp.transmission) as TransmissionType | undefined;
  const sort = (str(sp.sort) as CatalogSort | undefined) ?? 'recent';
  const minPrice = num(sp.min);
  const maxPrice = num(sp.max);
  const minYear = num(sp.year);
  const q = str(sp.q);

  const [cars, brands] = await Promise.all([
    getPublishedCars({
      brandSlug,
      transmission,
      sort,
      minYear,
      q,
      minPriceCentavos: minPrice != null ? pesosToCentavos(minPrice) : undefined,
      maxPriceCentavos: maxPrice != null ? pesosToCentavos(maxPrice) : undefined,
    }),
    getBrandsWithPublished(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Catálogo</h1>
        <p className="mt-1 text-sm text-slate-500">
          {cars.length}{' '}
          {cars.length === 1 ? 'auto verificado disponible' : 'autos verificados disponibles'}
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Filters */}
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-card lg:sticky lg:top-20">
            <form method="get" className="space-y-4">
              <Field label="Buscar">
                <Input name="q" defaultValue={q} placeholder="Ej. Hilux, Civic…" />
              </Field>
              <Field label="Marca">
                <Select name="brand" defaultValue={brandSlug ?? ''}>
                  <option value="">Todas</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Transmisión">
                <Select name="transmission" defaultValue={transmission ?? ''}>
                  <option value="">Cualquiera</option>
                  <option value="AUTOMATIC">Automática</option>
                  <option value="MANUAL">Manual</option>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Precio mín.">
                  <Input name="min" type="number" inputMode="numeric" defaultValue={minPrice} />
                </Field>
                <Field label="Precio máx.">
                  <Input name="max" type="number" inputMode="numeric" defaultValue={maxPrice} />
                </Field>
              </div>
              <Field label="Año desde">
                <Input name="year" type="number" inputMode="numeric" defaultValue={minYear} />
              </Field>
              <Field label="Ordenar por">
                <Select name="sort" defaultValue={sort}>
                  <option value="recent">Más recientes</option>
                  <option value="price_asc">Precio: menor a mayor</option>
                  <option value="price_desc">Precio: mayor a menor</option>
                  <option value="year_desc">Año: más nuevo</option>
                </Select>
              </Field>
              <Button type="submit" className="w-full">
                Aplicar filtros
              </Button>
            </form>
          </aside>

          {/* Results */}
          <section>
            {cars.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                No encontramos autos con esos filtros.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {cars.map((car, i) => (
                  <Reveal key={car.id} delay={(i % 3) * 70}>
                    <CarCard car={car} />
                  </Reveal>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
