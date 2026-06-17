import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CarForm } from '../car-form';
import { createCar } from '../actions';

export const metadata: Metadata = { title: 'Nuevo auto' };

export default function NewCarPage() {
  return (
    <div>
      <Link
        href="/admin/autos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={15} /> Autos
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Nuevo auto</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        Crea el borrador. Después agregas fotos y registras la verificación legal antes de publicar.
      </p>
      <CarForm action={createCar} submitLabel="Crear borrador" />
    </div>
  );
}
