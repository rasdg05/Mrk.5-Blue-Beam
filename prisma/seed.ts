import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const PHOTOS = [
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8',
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888',
  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2',
  'https://images.unsplash.com/photo-1542362567-b07e54358753',
  'https://images.unsplash.com/photo-1493238792000-8113da705763',
  'https://images.unsplash.com/photo-1617470703257-d5d6c83a5d34',
].map((u) => `${u}?w=1200&q=60&auto=format&fit=crop`);

interface DemoCar {
  brand: string;
  model: string;
  title: string;
  year: number;
  km: number;
  pricePesos: number;
  transmission: 'MANUAL' | 'AUTOMATIC';
  fuel: 'GASOLINE' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'GAS';
  color: string;
  depositPct: number;
  city: string;
  state: string;
  crypto: boolean;
  features: string[];
  photos: number[];
  thirdParty?: boolean;
  draft?: boolean;
}

const DEMO_CARS: DemoCar[] = [
  {
    brand: 'Toyota', model: 'Hilux', title: 'Toyota Hilux 2020 SR 4x4', year: 2020, km: 62000,
    pricePesos: 489000, transmission: 'MANUAL', fuel: 'DIESEL', color: 'Blanco', depositPct: 10,
    city: 'CDMX', state: 'CDMX', crypto: true, features: ['4x4', 'Aire', 'Cámara de reversa'],
    photos: [0, 3],
  },
  {
    brand: 'Honda', model: 'Civic', title: 'Honda Civic 2019 Turbo', year: 2019, km: 48000,
    pricePesos: 329000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Gris', depositPct: 10,
    city: 'Guadalajara', state: 'Jalisco', crypto: true, features: ['Quemacocos', 'Pantalla', 'Sensores'],
    photos: [1, 2],
  },
  {
    brand: 'Mazda', model: 'CX-5', title: 'Mazda CX-5 2021 Grand Touring', year: 2021, km: 35000,
    pricePesos: 459000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Rojo', depositPct: 10,
    city: 'Monterrey', state: 'Nuevo León', crypto: false, features: ['Piel', 'Cámara 360', 'Bose'],
    photos: [7, 4],
  },
  {
    brand: 'Volkswagen', model: 'Jetta', title: 'Volkswagen Jetta 2018 Comfortline', year: 2018, km: 71000,
    pricePesos: 239000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Plata', depositPct: 12,
    city: 'Puebla', state: 'Puebla', crypto: false, features: ['Aire', 'Bluetooth'],
    photos: [5, 2],
  },
  {
    brand: 'Nissan', model: 'Versa', title: 'Nissan Versa 2022 Advance', year: 2022, km: 22000,
    pricePesos: 279000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Negro', depositPct: 10,
    city: 'CDMX', state: 'CDMX', crypto: true, features: ['Pantalla', 'Cámara de reversa'],
    photos: [6, 1],
  },
  {
    brand: 'Toyota', model: 'Corolla', title: 'Toyota Corolla 2020 LE', year: 2020, km: 54000,
    pricePesos: 309000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Blanco', depositPct: 10,
    city: 'Querétaro', state: 'Querétaro', crypto: true, features: ['Aire', 'Control crucero'],
    photos: [2, 0],
  },
  {
    brand: 'Kia', model: 'Sportage', title: 'Kia Sportage 2021 (consignación)', year: 2021, km: 41000,
    pricePesos: 419000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Azul', depositPct: 10,
    city: 'Mérida', state: 'Yucatán', crypto: false, features: ['Piel', 'Quemacocos'],
    photos: [3, 7], thirdParty: true,
  },
  {
    brand: 'Ford', model: 'Ranger', title: 'Ford Ranger 2019 XLT (borrador)', year: 2019, km: 88000,
    pricePesos: 399000, transmission: 'MANUAL', fuel: 'DIESEL', color: 'Gris', depositPct: 10,
    city: 'CDMX', state: 'CDMX', crypto: false, features: ['4x4'],
    photos: [4], draft: true,
  },
];

async function upsertBrandModel(brandName: string, modelName: string) {
  const brand = await prisma.brand.upsert({
    where: { slug: slugify(brandName) },
    update: {},
    create: { name: brandName, slug: slugify(brandName) },
  });
  const model = await prisma.model.upsert({
    where: { brandId_slug: { brandId: brand.id, slug: slugify(modelName) } },
    update: {},
    create: { brandId: brand.id, name: modelName, slug: slugify(modelName) },
  });
  return { brandId: brand.id, modelId: model.id };
}

async function main() {
  // Admin
  const adminEmail = 'admin@autosmx.test';
  const adminPassword = 'admin1234';
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin Autos MX',
      role: 'SUPERADMIN',
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  // Third-party seller
  const seller = await prisma.seller.upsert({
    where: { email: 'vendedor@ejemplo.mx' },
    update: {},
    create: {
      email: 'vendedor@ejemplo.mx',
      name: 'Juan Pérez',
      phone: '+52 55 1234 5678',
      payoutClabe: '012180001234567895',
      kyc: { create: { status: 'VERIFIED', verifiedAt: new Date() } },
    },
  });

  const now = new Date();
  for (const c of DEMO_CARS) {
    const exists = await prisma.car.findFirst({ where: { title: c.title } });
    if (exists) continue;

    const { brandId, modelId } = await upsertBrandModel(c.brand, c.model);
    await prisma.car.create({
      data: {
        title: c.title,
        brandId,
        modelId,
        year: c.year,
        mileageKm: c.km,
        transmission: c.transmission,
        fuel: c.fuel,
        color: c.color,
        priceMxn: c.pricePesos * 100,
        locationCity: c.city,
        locationState: c.state,
        ownership: c.thirdParty ? 'THIRD_PARTY' : 'PLATFORM',
        sellerId: c.thirdParty ? seller.id : null,
        paymentMode: 'DEPOSIT',
        depositType: 'PERCENT',
        depositValue: c.depositPct * 100, // basis points
        acceptsMercadoPago: true,
        acceptsCrypto: c.crypto,
        legalCheckStatus: c.draft ? 'PENDING' : 'APPROVED',
        repuveStatus: c.draft ? 'UNKNOWN' : 'CLEAR',
        repuveCheckedAt: c.draft ? null : now,
        verifiedAt: c.draft ? null : now,
        photographedAt: c.draft ? null : now,
        status: c.draft ? 'DRAFT' : 'PUBLISHED',
        publishedAt: c.draft ? null : now,
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
  }

  console.log('✅ Seed completo.');
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
