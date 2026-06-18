import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';

/**
 * One-time seed endpoint (admin + demo catalog), protected by CRON_SECRET.
 * Runs inside the deployment so it can reach the internal database. Idempotent:
 * the admin is upserted and cars are skipped if a same-titled one already exists.
 * Remove this route after the catalog is populated.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=60&auto=format&fit=crop`;

interface SeedCar {
  brand: string;
  model: string;
  title: string;
  year: number;
  km: number;
  pricePesos: number;
  transmission: 'MANUAL' | 'AUTOMATIC';
  fuel: 'GASOLINE' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'GAS';
  color: string;
  city: string;
  state: string;
  crypto: boolean;
  features: string[];
  photos: string[];
}

const CARS: SeedCar[] = [
  { brand: 'Toyota', model: 'Hilux', title: 'Toyota Hilux 2021 SR 4x4', year: 2021, km: 58000, pricePesos: 529000, transmission: 'MANUAL', fuel: 'DIESEL', color: 'Blanco', city: 'CDMX', state: 'CDMX', crypto: true, features: ['4x4', 'Aire acondicionado', 'Cámara de reversa'], photos: ['1617470703257-d5d6c83a5d34', '1605559424843-9e4c228bf1c2'] },
  { brand: 'Mazda', model: 'CX-5', title: 'Mazda CX-5 2022 Grand Touring', year: 2022, km: 31000, pricePesos: 479000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Rojo', city: 'Monterrey', state: 'Nuevo León', crypto: false, features: ['Piel', 'Cámara 360', 'Bose'], photos: ['1568605117036-5fe5e7bab0b7', '1583121274602-3e2820c69888'] },
  { brand: 'Honda', model: 'Civic', title: 'Honda Civic 2020 Turbo', year: 2020, km: 44000, pricePesos: 359000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Gris', city: 'Guadalajara', state: 'Jalisco', crypto: true, features: ['Quemacocos', 'Pantalla táctil', 'Sensores'], photos: ['1552519507-da3b142c6e3d', '1494976388531-d1058494cdd8'] },
  { brand: 'Nissan', model: 'Versa', title: 'Nissan Versa 2022 Advance', year: 2022, km: 22000, pricePesos: 289000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Negro', city: 'CDMX', state: 'CDMX', crypto: true, features: ['Pantalla táctil', 'Cámara de reversa'], photos: ['1605559424843-9e4c228bf1c2', '1552519507-da3b142c6e3d'] },
  { brand: 'Volkswagen', model: 'Jetta', title: 'Volkswagen Jetta 2019 Comfortline', year: 2019, km: 67000, pricePesos: 259000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Plata', city: 'Puebla', state: 'Puebla', crypto: false, features: ['Aire acondicionado', 'Bluetooth'], photos: ['1583121274602-3e2820c69888', '1568605117036-5fe5e7bab0b7'] },
  { brand: 'Toyota', model: 'Corolla', title: 'Toyota Corolla 2021 LE', year: 2021, km: 39000, pricePesos: 339000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Blanco', city: 'Querétaro', state: 'Querétaro', crypto: true, features: ['Aire acondicionado', 'Control crucero'], photos: ['1494976388531-d1058494cdd8', '1617470703257-d5d6c83a5d34'] },
  { brand: 'Kia', model: 'Sportage', title: 'Kia Sportage 2021 EX', year: 2021, km: 41000, pricePesos: 429000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Azul', city: 'Mérida', state: 'Yucatán', crypto: false, features: ['Piel', 'Quemacocos'], photos: ['1503376780353-7e6692767b70', '1542362567-b07e54358753'] },
  { brand: 'Chevrolet', model: 'Onix', title: 'Chevrolet Onix 2022 Premier', year: 2022, km: 28000, pricePesos: 289000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Gris', city: 'León', state: 'Guanajuato', crypto: true, features: ['Pantalla táctil', 'Wi-Fi', 'Sensores'], photos: ['1542362567-b07e54358753', '1503376780353-7e6692767b70'] },
  { brand: 'Hyundai', model: 'Tucson', title: 'Hyundai Tucson 2020 Limited', year: 2020, km: 52000, pricePesos: 409000, transmission: 'AUTOMATIC', fuel: 'GASOLINE', color: 'Blanco', city: 'Tijuana', state: 'Baja California', crypto: false, features: ['Piel', 'Cámara de reversa', 'Llave inteligente'], photos: ['1493238792000-8113da705763', '1605559424843-9e4c228bf1c2'] },
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

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const adminEmail = 'admin@autosmx.test';
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin Autos MX',
      role: 'SUPERADMIN',
      passwordHash: await bcrypt.hash('admin1234', 10),
    },
  });

  const now = new Date();
  let created = 0;
  let skipped = 0;
  for (const c of CARS) {
    const exists = await prisma.car.findFirst({ where: { title: c.title } });
    if (exists) {
      skipped += 1;
      continue;
    }
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
        ownership: 'PLATFORM',
        paymentMode: 'DEPOSIT',
        depositType: 'PERCENT',
        depositValue: 1000, // basis points = 10%
        acceptsMercadoPago: true,
        acceptsCrypto: c.crypto,
        legalCheckStatus: 'APPROVED',
        repuveStatus: 'CLEAR',
        repuveCheckedAt: now,
        verifiedAt: now,
        photographedAt: now,
        status: 'PUBLISHED',
        publishedAt: now,
        features: { create: c.features.map((label) => ({ label })) },
        photos: {
          create: c.photos.map((id, i) => ({ url: unsplash(id), sortOrder: i, isCover: i === 0 })),
        },
      },
    });
    created += 1;
  }

  return NextResponse.json({ ok: true, admin: adminEmail, carsCreated: created, carsSkipped: skipped });
}
