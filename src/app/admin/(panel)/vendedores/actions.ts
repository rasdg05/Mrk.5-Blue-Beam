'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/session';

export async function setSellerKyc(formData: FormData): Promise<void> {
  const admin = await requireAdmin('ADMIN');
  const sellerId = String(formData.get('sellerId'));
  const status = String(formData.get('status')) as 'PENDING' | 'VERIFIED' | 'REJECTED';

  await prisma.sellerKyc.upsert({
    where: { sellerId },
    update: {
      status,
      verifiedAt: status === 'VERIFIED' ? new Date() : null,
      verifiedByAdminId: admin.id,
    },
    create: { sellerId, status },
  });
  revalidatePath('/admin/vendedores');
}
