'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createAdminSession } from '@/lib/auth/session';

export interface LoginState {
  error?: string;
}

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAdmin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: 'Credenciales inválidas' };

  const admin = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (!admin || !admin.active || !(await verifyPassword(parsed.data.password, admin.passwordHash))) {
    return { error: 'Email o contraseña incorrectos' };
  }

  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await createAdminSession({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });
  redirect('/admin');
}
