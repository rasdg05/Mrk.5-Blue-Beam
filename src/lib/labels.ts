import type {
  CarStatus,
  OrderStatus,
  PaymentStatus,
  TransmissionType,
  FuelType,
} from '@prisma/client';

export const carStatusLabel: Record<CarStatus, string> = {
  DRAFT: 'Borrador',
  SUBMITTED: 'Por revisar',
  PUBLISHED: 'Publicado',
  RESERVED: 'Reservado',
  SOLD: 'Vendido',
  ARCHIVED: 'Archivado',
};

export const transmissionLabel: Record<TransmissionType, string> = {
  MANUAL: 'Manual',
  AUTOMATIC: 'Automática',
};

export const fuelLabel: Record<FuelType, string> = {
  GASOLINE: 'Gasolina',
  DIESEL: 'Diésel',
  HYBRID: 'Híbrido',
  ELECTRIC: 'Eléctrico',
  GAS: 'Gas LP',
};

export const orderStatusLabel: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: 'Esperando pago',
  RESERVED: 'Reservado (anticipo pagado)',
  PAID: 'Pagado',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Vencido',
  COMPLETED: 'Completado',
  REFUNDED: 'Reembolsado',
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROCESS: 'En proceso',
  CONFIRMING: 'Confirmando',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Vencido',
  REFUNDED: 'Reembolsado',
  PARTIALLY_REFUNDED: 'Reembolso parcial',
  UNDERPAID: 'Pago insuficiente',
  OVERPAID: 'Pago en exceso',
};

export function kmLabel(km: number): string {
  return `${km.toLocaleString('es-MX')} km`;
}
