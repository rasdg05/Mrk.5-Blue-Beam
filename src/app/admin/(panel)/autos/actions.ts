'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/session';
import { pesosToCentavos } from '@/lib/money';
import { slugify } from '@/lib/utils';
import { insertSampleCars } from '@/lib/sample-cars';

const carSchema = z.object({
  brandName: z.string().min(1, 'Marca requerida'),
  modelName: z.string().min(1, 'Modelo requerido'),
  title: z.string().min(3, 'Título requerido'),
  year: z.coerce.number().int().min(1950).max(2100),
  mileageKm: z.coerce.number().int().min(0),
  priceMxn: z.coerce.number().positive('Precio inválido'),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']),
  fuel: z.enum(['GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC', 'GAS']),
  color: z.string().optional(),
  doors: z.coerce.number().int().optional(),
  vin: z.string().optional(),
  description: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  ownership: z.enum(['PLATFORM', 'THIRD_PARTY']),
  sellerEmail: z.string().email().optional().or(z.literal('')),
  paymentMode: z.enum(['DEPOSIT', 'FULL']),
  depositType: z.enum(['FIXED', 'PERCENT']).optional().or(z.literal('')),
  depositValue: z.coerce.number().optional(),
  features: z.string().optional(),
});

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on' || formData.get(key) === 'true';
}

function buildCarData(formData: FormData) {
  const parsed = carSchema.parse(Object.fromEntries(formData));

  let depositType: 'FIXED' | 'PERCENT' | null = null;
  let depositValue: number | null = null;
  if (parsed.paymentMode === 'DEPOSIT') {
    if (parsed.depositType === 'FIXED') {
      depositType = 'FIXED';
      depositValue = pesosToCentavos(parsed.depositValue ?? 0); // pesos -> centavos
    } else if (parsed.depositType === 'PERCENT') {
      depositType = 'PERCENT';
      depositValue = Math.round((parsed.depositValue ?? 0) * 100); // percent -> basis points
    }
  }

  return { parsed, depositType, depositValue };
}

async function findOrCreateBrandModel(brandName: string, modelName: string) {
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

async function resolveSellerId(ownership: string, sellerEmail?: string): Promise<string | null> {
  if (ownership !== 'THIRD_PARTY' || !sellerEmail) return null;
  const seller = await prisma.seller.upsert({
    where: { email: sellerEmail },
    update: {},
    create: { email: sellerEmail, name: sellerEmail, kyc: { create: { status: 'PENDING' } } },
  });
  return seller.id;
}

function featureList(raw?: string): string[] {
  return (raw ?? '')
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);
}

export async function createCar(formData: FormData): Promise<void> {
  await requireAdmin();
  const { parsed, depositType, depositValue } = buildCarData(formData);
  const { brandId, modelId } = await findOrCreateBrandModel(parsed.brandName, parsed.modelName);
  const sellerId = await resolveSellerId(parsed.ownership, parsed.sellerEmail || undefined);

  const car = await prisma.car.create({
    data: {
      title: parsed.title,
      vin: parsed.vin || null,
      brandId,
      modelId,
      year: parsed.year,
      mileageKm: parsed.mileageKm,
      transmission: parsed.transmission,
      fuel: parsed.fuel,
      color: parsed.color || null,
      doors: parsed.doors ?? null,
      description: parsed.description || null,
      priceMxn: pesosToCentavos(parsed.priceMxn),
      locationCity: parsed.locationCity || null,
      locationState: parsed.locationState || null,
      ownership: parsed.ownership,
      sellerId,
      paymentMode: parsed.paymentMode,
      depositType,
      depositValue,
      acceptsMercadoPago: bool(formData, 'acceptsMercadoPago'),
      acceptsCrypto: bool(formData, 'acceptsCrypto'),
      status: 'DRAFT',
      features: { create: featureList(parsed.features).map((label) => ({ label })) },
    },
  });

  redirect(`/admin/autos/${car.id}`);
}

export async function updateCar(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id'));
  const { parsed, depositType, depositValue } = buildCarData(formData);
  const { brandId, modelId } = await findOrCreateBrandModel(parsed.brandName, parsed.modelName);
  const sellerId = await resolveSellerId(parsed.ownership, parsed.sellerEmail || undefined);

  await prisma.$transaction([
    prisma.carFeature.deleteMany({ where: { carId: id } }),
    prisma.car.update({
      where: { id },
      data: {
        title: parsed.title,
        vin: parsed.vin || null,
        brandId,
        modelId,
        year: parsed.year,
        mileageKm: parsed.mileageKm,
        transmission: parsed.transmission,
        fuel: parsed.fuel,
        color: parsed.color || null,
        doors: parsed.doors ?? null,
        description: parsed.description || null,
        priceMxn: pesosToCentavos(parsed.priceMxn),
        locationCity: parsed.locationCity || null,
        locationState: parsed.locationState || null,
        ownership: parsed.ownership,
        sellerId,
        paymentMode: parsed.paymentMode,
        depositType,
        depositValue,
        acceptsMercadoPago: bool(formData, 'acceptsMercadoPago'),
        acceptsCrypto: bool(formData, 'acceptsCrypto'),
        features: { create: featureList(parsed.features).map((label) => ({ label })) },
      },
    }),
  ]);

  revalidatePath(`/admin/autos/${id}`);
  redirect(`/admin/autos/${id}?saved=1`);
}

export async function publishCar(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id'));
  const car = await prisma.car.findUnique({ where: { id }, include: { _count: { select: { photos: true } } } });
  if (!car) redirect('/admin/autos');

  const errors: string[] = [];
  if (car!._count.photos < 1) errors.push('Agrega al menos una foto');
  if (car!.priceMxn <= 0) errors.push('El precio debe ser mayor a 0');
  if (car!.paymentMode === 'DEPOSIT' && (!car!.depositType || !car!.depositValue)) {
    errors.push('Configura el anticipo (tipo y valor)');
  }
  if (car!.ownership === 'THIRD_PARTY' && car!.paymentMode === 'FULL') {
    errors.push('Autos de terceros solo admiten anticipo en línea (Fase 1)');
  }
  if (car!.legalCheckStatus !== 'APPROVED') {
    errors.push('Registra la revisión legal aprobada antes de publicar');
  }

  if (errors.length > 0) {
    redirect(`/admin/autos/${id}?error=${encodeURIComponent(errors.join(' · '))}`);
  }

  await prisma.car.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: new Date(), version: { increment: 1 } },
  });
  revalidatePath('/autos');
  revalidatePath(`/admin/autos/${id}`);
  redirect(`/admin/autos/${id}?published=1`);
}

export async function unpublishCar(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id'));
  await prisma.car.updateMany({
    where: { id, status: 'PUBLISHED' },
    data: { status: 'DRAFT', version: { increment: 1 } },
  });
  revalidatePath('/autos');
  revalidatePath(`/admin/autos/${id}`);
}

export async function markSold(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id'));
  await prisma.car.update({ where: { id }, data: { status: 'SOLD', version: { increment: 1 } } });
  revalidatePath(`/admin/autos/${id}`);
}

export async function recordCarVerification(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get('id'));
  const legal = String(formData.get('legalCheckStatus')) as 'PENDING' | 'APPROVED' | 'REJECTED';
  const repuve = String(formData.get('repuveStatus')) as 'CLEAR' | 'REPORTED' | 'UNKNOWN';
  const reportUrl = String(formData.get('verificationReportUrl') || '') || null;

  await prisma.car.update({
    where: { id },
    data: {
      legalCheckStatus: legal,
      repuveStatus: repuve,
      repuveCheckedAt: new Date(),
      verificationReportUrl: reportUrl,
      verifiedByAdminId: admin.id,
      verifiedAt: legal === 'APPROVED' ? new Date() : null,
    },
  });
  revalidatePath(`/admin/autos/${id}`);
}

export async function addCarPhoto(formData: FormData): Promise<void> {
  await requireAdmin();
  const carId = String(formData.get('carId'));
  const url = String(formData.get('url') || '').trim();
  if (!url) return;
  const count = await prisma.carPhoto.count({ where: { carId } });
  await prisma.carPhoto.create({
    data: { carId, url, sortOrder: count, isCover: count === 0 },
  });
  revalidatePath(`/admin/autos/${carId}`);
}

export async function deleteCarPhoto(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('photoId'));
  const carId = String(formData.get('carId'));
  await prisma.carPhoto.delete({ where: { id } });
  revalidatePath(`/admin/autos/${carId}`);
}

/**
 * Permanently delete a car (and its photos/features via cascade). Refuses if the
 * car has any orders — those must be preserved for audit; unpublish instead.
 */
export async function deleteCar(formData: FormData): Promise<void> {
  await requireAdmin('ADMIN');
  const id = String(formData.get('id'));
  const orderCount = await prisma.order.count({ where: { carId: id } });
  if (orderCount > 0) {
    redirect(
      `/admin/autos/${id}?error=${encodeURIComponent(
        'Este auto tiene órdenes asociadas; no se puede eliminar. Despublícalo en su lugar.',
      )}`,
    );
  }
  await prisma.$transaction([
    prisma.lead.updateMany({ where: { carId: id }, data: { carId: null } }),
    prisma.reservation.deleteMany({ where: { carId: id } }),
    prisma.car.delete({ where: { id } }), // cascade removes photos + features
  ]);
  revalidatePath('/admin/autos');
  revalidatePath('/autos');
  redirect('/admin/autos');
}

/** One-click: load a set of published sample cars (idempotent). */
export async function loadSampleCars(): Promise<void> {
  await requireAdmin('ADMIN');
  await insertSampleCars(prisma);
  revalidatePath('/admin/autos');
  revalidatePath('/autos');
  redirect('/admin/autos');
}
