import { Resend } from 'resend';
import { env } from '@/lib/env';
import { formatMXN } from '@/lib/money';

/**
 * Notification service. Email via Resend when configured; otherwise a no-op that
 * logs (so local/dev and unconfigured environments don't crash). WhatsApp is a
 * Phase 2 channel behind this same module.
 */
let resendClient: Resend | null = null;
function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  resendClient ??= new Resend(env.RESEND_API_KEY);
  return resendClient;
}

async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log(`[email:noop] to=${opts.to} subject="${opts.subject}"`);
    return;
  }
  try {
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
  } catch (err) {
    // Never let a notification failure break the payment/order flow.
    console.error('[email:error]', err);
  }
}

function layout(title: string, body: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
    <h2 style="color:#1e66f1">${title}</h2>
    ${body}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
    <p style="color:#64748b;font-size:12px">Autos MX — compraventa de autos verificados</p>
  </div>`;
}

export interface OrderEmailContext {
  to: string;
  orderNumber: string;
  carTitle: string;
  amountDueCentavos: number;
  balanceDueCentavos: number;
}

export async function notifyBuyerReservation(ctx: OrderEmailContext): Promise<void> {
  await sendEmail({
    to: ctx.to,
    subject: `Reserva confirmada — ${ctx.carTitle} (${ctx.orderNumber})`,
    html: layout(
      '¡Tu reserva está confirmada! 🎉',
      `<p>Recibimos tu anticipo de <strong>${formatMXN(ctx.amountDueCentavos)}</strong> por el <strong>${ctx.carTitle}</strong>.</p>
       <p>Saldo a liquidar al concretar la operación: <strong>${formatMXN(ctx.balanceDueCentavos)}</strong>.</p>
       <p>Número de orden: <strong>${ctx.orderNumber}</strong>. Te contactaremos para coordinar la entrega y la firma.</p>`,
    ),
  });
}

export async function notifyBuyerPaid(ctx: OrderEmailContext): Promise<void> {
  await sendEmail({
    to: ctx.to,
    subject: `Pago confirmado — ${ctx.carTitle} (${ctx.orderNumber})`,
    html: layout(
      'Pago confirmado ✅',
      `<p>Confirmamos tu pago de <strong>${formatMXN(ctx.amountDueCentavos)}</strong> por el <strong>${ctx.carTitle}</strong>.</p>
       <p>Número de orden: <strong>${ctx.orderNumber}</strong>. Te contactaremos para los siguientes pasos.</p>`,
    ),
  });
}

export async function notifyBuyerPaymentFailed(ctx: OrderEmailContext): Promise<void> {
  await sendEmail({
    to: ctx.to,
    subject: `No pudimos procesar tu pago — ${ctx.orderNumber}`,
    html: layout(
      'Hubo un problema con tu pago',
      `<p>No pudimos confirmar el pago de la orden <strong>${ctx.orderNumber}</strong> (${ctx.carTitle}).</p>
       <p>Podés intentar nuevamente desde la página de la orden.</p>`,
    ),
  });
}

export async function notifyBuyerRefund(ctx: OrderEmailContext): Promise<void> {
  await sendEmail({
    to: ctx.to,
    subject: `Reembolso emitido — ${ctx.orderNumber}`,
    html: layout(
      'Reembolso emitido',
      `<p>Emitimos el reembolso de tu orden <strong>${ctx.orderNumber}</strong> (${ctx.carTitle}).</p>
       <p>El tiempo de acreditación depende de tu método de pago.</p>`,
    ),
  });
}

export async function notifyAdmin(subject: string, message: string): Promise<void> {
  if (!env.ADMIN_NOTIFICATION_EMAIL) {
    console.log(`[admin-notify:noop] ${subject}`);
    return;
  }
  await sendEmail({
    to: env.ADMIN_NOTIFICATION_EMAIL,
    subject: `[Autos MX] ${subject}`,
    html: layout(subject, `<p>${message}</p>`),
  });
}
