import Link from 'next/link';
import { Car, LayoutDashboard, LogOut, ShoppingCart, Users } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { logoutAdmin } from './actions';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/autos', label: 'Autos', icon: Car },
  { href: '/admin/ordenes', label: 'Órdenes', icon: ShoppingCart },
  { href: '/admin/vendedores', label: 'Vendedores', icon: Users },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-60 flex-col border-r border-slate-200 bg-white sm:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Car size={16} />
          </span>
          Autos MX
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <item.icon size={17} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <p className="px-3 pb-2 text-xs text-slate-500">
            {admin.name}
            <br />
            <span className="text-slate-400">{admin.email}</span>
          </p>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <LogOut size={17} />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">{children}</div>
      </main>
    </div>
  );
}
