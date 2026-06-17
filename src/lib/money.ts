import type { DepositType } from '@prisma/client';

/**
 * Money is handled as integer MINOR UNITS (centavos for MXN). Never use floats
 * for money math; only convert to a float at the display boundary.
 */
export const MINOR_UNITS_PER_MAJOR = 100;

export function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * MINOR_UNITS_PER_MAJOR);
}

export function centavosToPesos(centavos: number): number {
  return centavos / MINOR_UNITS_PER_MAJOR;
}

const mxnFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format centavos as a MXN string, e.g. 37656500 -> "$376,565". */
export function formatMXN(centavos: number): string {
  return mxnFormatter.format(centavosToPesos(centavos));
}

/**
 * Compute the deposit ("seña") amount in centavos from a listing's config.
 * - FIXED: depositValue is centavos.
 * - PERCENT: depositValue is basis points (1000 = 10.00%).
 * Always clamped to [0, priceCentavos].
 */
export function computeDepositCentavos(
  priceCentavos: number,
  depositType: DepositType | null,
  depositValue: number | null,
): number {
  if (depositType === null || depositValue === null) {
    return 0;
  }
  let deposit: number;
  if (depositType === 'FIXED') {
    deposit = depositValue;
  } else {
    // PERCENT — depositValue is basis points
    deposit = Math.round((priceCentavos * depositValue) / 10_000);
  }
  return Math.max(0, Math.min(deposit, priceCentavos));
}
