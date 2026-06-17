import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import type { AdminRole } from '@prisma/client';
import { env } from '@/lib/env';

/**
 * Lean admin session: a signed JWT in an httpOnly cookie (jose + bcrypt for
 * passwords). Buyer flows use guest checkout in Phase 1, so auth surface is the
 * admin panel only. Designed to be swappable for Auth.js later.
 */
const COOKIE_NAME = 'amx_admin_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Computed lazily so importing this module doesn't read env at build time.
let secretKeyCache: Uint8Array | null = null;
function secretKey(): Uint8Array {
  return (secretKeyCache ??= new TextEncoder().encode(env.AUTH_SECRET));
}

export interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export async function createAdminSession(session: AdminSession): Promise<void> {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.id === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.name === 'string' &&
      typeof payload.role === 'string'
    ) {
      return {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        role: payload.role as AdminRole,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

const ROLE_RANK: Record<AdminRole, number> = { EDITOR: 1, ADMIN: 2, SUPERADMIN: 3 };

/** Require an authenticated admin; redirect to login if absent. Optionally enforce a minimum role. */
export async function requireAdmin(minRole: AdminRole = 'EDITOR'): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  if (ROLE_RANK[session.role] < ROLE_RANK[minRole]) {
    redirect('/admin?error=forbidden');
  }
  return session;
}
