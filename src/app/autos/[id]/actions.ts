'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createOrder, OrderError, type OrderErrorCode } from '@/lib/orders/create-order';

export interface CheckoutState {
  error?: string;
}

const schema = z.object({
  carId: z.string().min(1),
  method: z.enum(['mercadopago', 'crypto']),
  email: z.string().email('Ingresá un email válido'),
  name: z.string().min(2, 'Ingresá tu nombre completo'),
  phone: z.string().optional(),
});

function messageFor(code: OrderErrorCode): string {
  switch (code) {
    case 'CAR_NOT_FOUND':
      return 'Este auto ya no está disponible.';
    case 'CAR_NOT_AVAILABLE':
      return 'Este auto ya fue reservado por otra persona.';
    case 'METHOD_NOT_ACCEPTED':
      return 'Ese método de pago no está habilitado para este auto.';
    case 'INVALID_DEPOSIT_CONFIG':
      return 'Hubo un problema con la configuración de la seña. Contactanos.';
    case 'THIRD_PARTY_FULL_NOT_ALLOWED':
      return 'Este auto solo admite reserva con seña en línea.';
    case 'PROVIDER_ERROR':
    default:
      return 'No pudimos iniciar el pago. Intentá nuevamente en unos minutos.';
  }
}

export async function startCheckout(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = schema.safeParse({
    carId: formData.get('carId'),
    method: formData.get('method'),
    email: formData.get('email'),
    name: formData.get('name'),
    phone: formData.get('phone') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  let checkoutUrl: string;
  try {
    const res = await createOrder({
      carId: parsed.data.carId,
      method: parsed.data.method,
      buyer: { email: parsed.data.email, name: parsed.data.name, phone: parsed.data.phone },
    });
    checkoutUrl = res.checkoutUrl;
  } catch (err) {
    if (err instanceof OrderError) return { error: messageFor(err.code) };
    return { error: 'No pudimos iniciar el pago. Intentá nuevamente.' };
  }

  // Redirect to the hosted checkout (Mercado Pago / crypto gateway).
  redirect(checkoutUrl);
}
