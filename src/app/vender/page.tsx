import type { Metadata } from 'next';
import { FileCheck2, HandCoins, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SellerForm } from './seller-form';

export const metadata: Metadata = { title: 'Vende tu auto' };

const STEPS = [
  { icon: ShieldCheck, title: '1. Registro + KYC', text: 'Verificamos tu identidad para una operación limpia y segura.' },
  { icon: FileCheck2, title: '2. Revisión legal', text: 'Revisamos documentos y consultamos REPUVE vía Buró Vehicular.' },
  { icon: HandCoins, title: '3. Publicación y venta', text: 'Publicamos tu auto verificado; al venderse, te liquidamos.' },
];

export default function SellPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Vende tu auto con respaldo</h1>
            <p className="mt-3 text-slate-600">
              Suma tu auto a un catálogo de autos verificados. Nos encargamos de la revisión legal,
              el fotografiado y el cobro seguro con Mercado Pago o crypto. Vos recibís tu pago con
              todo en regla.
            </p>
            <div className="mt-8 space-y-4">
              {STEPS.map((s) => (
                <div key={s.title} className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <s.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{s.title}</h3>
                    <p className="text-sm text-slate-600">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card className="h-fit p-6">
            <h2 className="text-lg font-bold text-slate-900">Empieza ahora</h2>
            <p className="mb-4 mt-1 text-sm text-slate-500">
              Dejanos tus datos y te contactamos para la verificación.
            </p>
            <SellerForm />
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
