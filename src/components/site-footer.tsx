import { BadgeCheck, Car, ShieldCheck, Wallet } from 'lucide-react';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Verificados',
    text: 'Cada auto pasa revisión legal y consulta REPUVE antes de publicarse.',
  },
  {
    icon: Wallet,
    title: 'Pagos seguros',
    text: 'Reserva con un anticipo por Mercado Pago o crypto (stablecoins).',
  },
  {
    icon: BadgeCheck,
    title: 'Operación limpia',
    text: 'Facturación y cumplimiento conforme a la normativa mexicana.',
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="group flex items-start gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                <f.icon size={18} />
              </span>
              <p className="text-sm text-slate-600">
                <strong className="block text-slate-900">{f.title}</strong>
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-slate-400 sm:flex-row">
          <span className="flex items-center gap-1.5 font-semibold text-slate-500">
            <Car size={14} className="text-brand-600" /> Autos MX
          </span>
          <p>© {new Date().getFullYear()} Autos MX · Compraventa de autos verificados</p>
        </div>
      </div>
    </footer>
  );
}
