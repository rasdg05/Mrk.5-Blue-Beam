import Link from 'next/link';
import { Car } from 'lucide-react';
import { buttonClasses } from '@/components/ui';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Car size={18} />
          </span>
          Autos MX
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/autos"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Catálogo
          </Link>
          <Link href="/vender" className={buttonClasses('outline', 'sm')}>
            Vender mi auto
          </Link>
        </nav>
      </div>
    </header>
  );
}
