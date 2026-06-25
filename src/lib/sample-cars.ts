import type { PrismaClient } from '@prisma/client';

// Self-contained (no `@/` alias) so this module works both inside the Next app
// and from the standalone `tsx prisma/seed-samples.ts` script.
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Known-good Unsplash photos (host whitelisted in next.config). These are
// placeholder supercar shots — swap real ones per listing via the Cloudinary
// uploader in the admin panel.
const PHOTOS = [
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8',
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888',
  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2',
  'https://images.unsplash.com/photo-1542362567-b07e54358753',
  'https://images.unsplash.com/photo-1493238792000-8113da705763',
  'https://images.unsplash.com/photo-1617470703257-d5d6c83a5d34',
].map((u) => `${u}?w=1600&q=70&auto=format&fit=crop`);

export interface SampleCar {
  brand: string;
  model: string;
  title: string;
  year: number;
  km: number;
  /** Pesos. NOTE: priceMxn is an Int column of centavos, so max ≈ $21.4M MXN. */
  pricePesos: number;
  transmission: 'MANUAL' | 'AUTOMATIC';
  fuel: 'GASOLINE' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'GAS';
  color: string;
  city: string;
  state: string;
  features: string[];
  photos: number[];
}

// Prices capped just under the Int(centavos) ceiling (~$21.4M MXN). They read as
// "tens of millions of pesos" for a convincing demo without overflowing the
// column. Bump priceMxn to BigInt if true supercar pricing is ever needed.
export const BUGATTI_SAMPLES: SampleCar[] = [
  {
    brand: 'Bugatti', model: 'Chiron', title: 'Bugatti Chiron 2022', year: 2022, km: 1800,
    pricePesos: 20_900_000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Azul Bugatti',
    city: 'CDMX', state: 'CDMX',
    features: ['Motor W16 8.0L', '1,500 hp', 'Fibra de carbono', 'Piel Nappa', 'Tracción integral'],
    photos: [3, 1, 5],
  },
  {
    brand: 'Bugatti', model: 'Veyron 16.4', title: 'Bugatti Veyron 16.4 2011', year: 2011, km: 9500,
    pricePesos: 18_900_000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Negro / Plata',
    city: 'Monterrey', state: 'Nuevo León',
    features: ['Motor W16 8.0L', '1,001 hp', 'Quad-turbo', 'Interior en piel'],
    photos: [1, 2, 7],
  },
  {
    brand: 'Bugatti', model: 'Divo', title: 'Bugatti Divo 2020', year: 2020, km: 600,
    pricePesos: 21_000_000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Gris Mate',
    city: 'Guadalajara', state: 'Jalisco',
    features: ['Edición limitada (40 unidades)', 'Aerodinámica de pista', 'Fibra de carbono', '1,500 hp'],
    photos: [0, 4, 3],
  },
  {
    brand: 'Bugatti', model: 'Chiron Super Sport', title: 'Bugatti Chiron Super Sport 2023', year: 2023, km: 450,
    pricePesos: 21_000_000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Negro Carbón',
    city: 'CDMX', state: 'CDMX',
    features: ['1,600 hp', 'Velocidad máx. 440 km/h', 'Modo Top Speed', 'Escape de titanio'],
    photos: [2, 5, 1],
  },
  {
    brand: 'Bugatti', model: 'Mistral W16', title: 'Bugatti W16 Mistral 2024 (roadster)', year: 2024, km: 120,
    pricePesos: 20_700_000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Amarillo / Negro',
    city: 'Cancún', state: 'Quintana Roo',
    features: ['Roadster', 'Último W16 de Bugatti', 'Edición de 99 unidades', 'Piel a medida'],
    photos: [5, 0, 4],
  },
];

/**
 * Idempotently inserts the sample cars (skips any whose title already exists).
 * Works with the app's prisma instance or a standalone PrismaClient.
 */
export async function insertSampleCars(
  prisma: PrismaClient,
  samples: SampleCar[] = BUGATTI_SAMPLES,
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;
  const now = new Date();

  for (const c of samples) {
    const exists = await prisma.car.findFirst({ where: { title: c.title }, select: { id: true } });
    if (exists) {
      skipped++;
      continue;
    }

    const brand = await prisma.brand.upsert({
      where: { slug: slugify(c.brand) },
      update: {},
      create: { name: c.brand, slug: slugify(c.brand) },
    });
    const model = await prisma.model.upsert({
      where: { brandId_slug: { brandId: brand.id, slug: slugify(c.model) } },
      update: {},
      create: { brandId: brand.id, name: c.model, slug: slugify(c.model) },
    });

    await prisma.car.create({
      data: {
        title: c.title,
        brandId: brand.id,
        modelId: model.id,
        year: c.year,
        mileageKm: c.km,
        transmission: c.transmission,
        fuel: c.fuel,
        color: c.color,
        priceMxn: c.pricePesos * 100,
        locationCity: c.city,
        locationState: c.state,
        ownership: 'PLATFORM',
        paymentMode: 'DEPOSIT',
        depositType: 'PERCENT',
        depositValue: 1000, // 10.00%
        acceptsMercadoPago: true,
        acceptsCrypto: true,
        legalCheckStatus: 'APPROVED',
        repuveStatus: 'CLEAR',
        repuveCheckedAt: now,
        verifiedAt: now,
        photographedAt: now,
        status: 'PUBLISHED',
        publishedAt: now,
        features: { create: c.features.map((label) => ({ label })) },
        photos: {
          create: c.photos.map((idx, i) => ({
            url: PHOTOS[idx]!,
            sortOrder: i,
            isCover: i === 0,
          })),
        },
      },
    });
    created++;
  }

  return { created, skipped };
}
