'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonClasses } from '@/components/ui';

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const catalogActive = pathname === '/autos' || pathname.startsWith('/autos/');

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur transition-shadow duration-300',
        scrolled ? 'shadow-sm' : 'shadow-none',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="group flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105">
            <Car size={18} />
          </span>
          <span className="tracking-tight">Autos MX</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/autos"
            className={cn(
              'group relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              catalogActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900',
            )}
          >
            Catálogo
            <span
              className={cn(
                'absolute inset-x-3 -bottom-0.5 h-0.5 origin-left rounded-full bg-brand-600 transition-transform duration-300',
                catalogActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
              )}
            />
          </Link>
          <Link href="/vender" className={buttonClasses('outline', 'sm')}>
            Vender mi auto
          </Link>
        </nav>
      </div>
    </header>
  );
}
