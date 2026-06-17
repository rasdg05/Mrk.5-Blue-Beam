import Link from 'next/link';
import { buttonClasses } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <p className="text-5xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-2 text-xl font-bold text-slate-900">No encontramos esta página</h1>
      <p className="mt-1 text-slate-500">El auto o la página que buscás ya no está disponible.</p>
      <Link href="/autos" className={`${buttonClasses('primary', 'md')} mt-6`}>
        Ver catálogo
      </Link>
    </div>
  );
}
