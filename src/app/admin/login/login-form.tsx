'use client';

import { useActionState } from 'react';
import { Field, Input } from '@/components/ui';
import { SubmitButton } from '@/components/submit-button';
import { loginAdmin, type LoginState } from './actions';

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAdmin, {});
  return (
    <form action={formAction} className="space-y-4">
      <Field label="Email">
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Contraseña">
        <Input name="password" type="password" required autoComplete="current-password" />
      </Field>
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <SubmitButton className="w-full" size="lg" pendingText="Ingresando…">
        Ingresar
      </SubmitButton>
    </form>
  );
}
