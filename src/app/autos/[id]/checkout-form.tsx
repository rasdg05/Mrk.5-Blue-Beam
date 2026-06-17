'use client';

import { useActionState } from 'react';
import { CreditCard, Bitcoin } from 'lucide-react';
import { Button, Field, Input } from '@/components/ui';
import { startCheckout, type CheckoutState } from './actions';

interface Props {
  carId: string;
  mode: 'DEPOSIT' | 'FULL';
  payLabel: string;
  acceptsMercadoPago: boolean;
  acceptsCrypto: boolean;
}

export function CheckoutForm({ carId, mode, payLabel, acceptsMercadoPago, acceptsCrypto }: Props) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(startCheckout, {});
  const defaultMethod = acceptsMercadoPago ? 'mercadopago' : 'crypto';

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="carId" value={carId} />

      <Field label="Nombre completo">
        <Input name="name" required autoComplete="name" placeholder="Tu nombre" />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" required autoComplete="email" placeholder="tu@email.com" />
      </Field>
      <Field label="WhatsApp (opcional)">
        <Input name="phone" autoComplete="tel" placeholder="+52 55 0000 0000" />
      </Field>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium text-slate-700">Método de pago</legend>
        {acceptsMercadoPago && (
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-300 p-3 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
            <input
              type="radio"
              name="method"
              value="mercadopago"
              defaultChecked={defaultMethod === 'mercadopago'}
            />
            <CreditCard size={18} className="text-brand-600" />
            <span>Mercado Pago — tarjeta, SPEI, OXXO</span>
          </label>
        )}
        {acceptsCrypto && (
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-300 p-3 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
            <input
              type="radio"
              name="method"
              value="crypto"
              defaultChecked={defaultMethod === 'crypto'}
            />
            <Bitcoin size={18} className="text-brand-600" />
            <span>Crypto — USDT / USDC (stablecoins)</span>
          </label>
        )}
      </fieldset>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending
          ? 'Redirigiendo…'
          : mode === 'DEPOSIT'
            ? `Reservar con un anticipo ${payLabel}`
            : `Pagar ${payLabel}`}
      </Button>
      <p className="text-center text-xs text-slate-500">
        Te redirigimos a la pasarela de pago segura. No guardamos datos de tu tarjeta.
      </p>
    </form>
  );
}
