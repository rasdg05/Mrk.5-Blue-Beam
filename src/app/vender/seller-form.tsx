'use client';

import { useActionState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button, Field, Input, Textarea } from '@/components/ui';
import { registerSeller, type SellerState } from './actions';

export function SellerForm() {
  const [state, formAction, pending] = useActionState<SellerState, FormData>(registerSeller, {});

  if (state.ok) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto text-emerald-600" size={32} />
        <h3 className="mt-2 font-semibold text-emerald-900">¡Solicitud recibida!</h3>
        <p className="mt-1 text-sm text-emerald-800">
          Te contactaremos para iniciar la verificación (KYC) y la revisión legal de tu auto.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <Field label="Nombre completo">
        <Input name="name" required placeholder="Tu nombre" />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" required placeholder="tu@email.com" />
      </Field>
      <Field label="WhatsApp">
        <Input name="phone" required placeholder="+52 55 0000 0000" />
      </Field>
      <Field label="Contanos sobre tu auto (opcional)">
        <Textarea name="message" placeholder="Marca, modelo, año, kilometraje…" />
      </Field>
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? 'Enviando…' : 'Quiero vender mi auto'}
      </Button>
    </form>
  );
}
