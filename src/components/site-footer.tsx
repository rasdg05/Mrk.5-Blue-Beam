import { BadgeCheck, ShieldCheck, Wallet } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-slate-600 sm:grid-cols-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 text-brand-600" size={18} />
          <p>
            <strong className="text-slate-900">Verificados</strong>
            <br />
            Cada auto pasa revisión legal y consulta REPUVE antes de publicarse.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Wallet className="mt-0.5 text-brand-600" size={18} />
          <p>
            <strong className="text-slate-900">Pagos seguros</strong>
            <br />
            Reserva con un anticipo por Mercado Pago o crypto (stablecoins).
          </p>
        </div>
        <div className="flex items-start gap-2">
          <BadgeCheck className="mt-0.5 text-brand-600" size={18} />
          <p>
            <strong className="text-slate-900">Operación limpia</strong>
            <br />
            Facturación y cumplimiento conforme a la normativa mexicana.
          </p>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Autos MX · Compraventa de autos verificados
      </div>
    </footer>
  );
}
