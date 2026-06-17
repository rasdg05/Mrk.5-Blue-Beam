'use server';

import { redirect } from 'next/navigation';
import { destroyAdminSession } from '@/lib/auth/session';

export async function logoutAdmin(): Promise<void> {
  await destroyAdminSession();
  redirect('/admin/login');
}
