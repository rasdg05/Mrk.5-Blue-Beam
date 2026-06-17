import type { FuelType, Prisma, TransmissionType } from '@prisma/client';
import { prisma } from '@/lib/db';

export type CatalogSort = 'recent' | 'price_asc' | 'price_desc' | 'year_desc';

export interface CatalogFilters {
  brandSlug?: string;
  q?: string;
  minPriceCentavos?: number;
  maxPriceCentavos?: number;
  minYear?: number;
  transmission?: TransmissionType;
  fuel?: FuelType;
  sort?: CatalogSort;
}

export async function getPublishedCars(filters: CatalogFilters = {}) {
  const where: Prisma.CarWhereInput = { status: 'PUBLISHED' };

  if (filters.brandSlug) where.brand = { slug: filters.brandSlug };
  if (filters.transmission) where.transmission = filters.transmission;
  if (filters.fuel) where.fuel = filters.fuel;
  if (filters.minYear) where.year = { gte: filters.minYear };
  if (filters.minPriceCentavos != null || filters.maxPriceCentavos != null) {
    where.priceMxn = {
      gte: filters.minPriceCentavos ?? undefined,
      lte: filters.maxPriceCentavos ?? undefined,
    };
  }
  if (filters.q) where.title = { contains: filters.q, mode: 'insensitive' };

  const orderBy: Prisma.CarOrderByWithRelationInput =
    filters.sort === 'price_asc'
      ? { priceMxn: 'asc' }
      : filters.sort === 'price_desc'
        ? { priceMxn: 'desc' }
        : filters.sort === 'year_desc'
          ? { year: 'desc' }
          : { publishedAt: 'desc' };

  return prisma.car.findMany({
    where,
    orderBy,
    take: 60,
    include: {
      brand: true,
      model: true,
      photos: { orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }], take: 1 },
    },
  });
}

export async function getPublicCar(id: string) {
  return prisma.car.findFirst({
    where: { id, status: { in: ['PUBLISHED', 'RESERVED', 'SOLD'] } },
    include: {
      brand: true,
      model: true,
      photos: { orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }] },
      features: true,
    },
  });
}

export async function getBrandsWithPublished() {
  return prisma.brand.findMany({
    where: { cars: { some: { status: 'PUBLISHED' } } },
    orderBy: { name: 'asc' },
  });
}

export type CatalogCar = Awaited<ReturnType<typeof getPublishedCars>>[number];
export type PublicCar = NonNullable<Awaited<ReturnType<typeof getPublicCar>>>;
