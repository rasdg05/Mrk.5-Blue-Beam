import type { Metadata } from 'next';
import { Car } from 'lucide-react';
import { Card } from '@/components/ui';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Acceso administrador' };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Car size={18} />
          </span>
          <div>
            <h1 className="font-bold text-slate-900">Autos MX</h1>
            <p className="text-xs text-slate-500">Panel de administración</p>
          </div>
        </div>
        <LoginForm />
      </Card>
    </div>
  );
}
