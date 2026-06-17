'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { notifyAdmin } from '@/lib/notifications';

export interface SellerState {
  ok?: boolean;
  error?: string;
}

const schema = z.object({
  name: z.string().min(2, 'Ingresá tu nombre'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(8, 'Ingresá un teléfono válido'),
  message: z.string().optional(),
});

export async function registerSeller(_prev: SellerState, formData: FormData): Promise<SellerState> {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    message: formData.get('message') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const { name, email, phone } = parsed.data;
  try {
    await prisma.seller.upsert({
      where: { email },
      update: { name, phone },
      create: {
        email,
        name,
        phone,
        kyc: { create: { status: 'PENDING' } },
      },
    });
    await notifyAdmin('Nuevo vendedor registrado', `${name} (${email}, ${phone}) quiere vender su auto.`);
    return { ok: true };
  } catch {
    return { error: 'No pudimos registrar tu solicitud. Intentá nuevamente.' };
  }
}
