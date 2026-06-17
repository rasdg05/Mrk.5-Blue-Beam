/**
 * Compliance & business constants.
 *
 * NOTE: these thresholds/rates are sensible defaults to make the system
 * "compliance-ready". The exact PLD/AML thresholds, commissions and retention
 * rules MUST be validated with a Mexican fiscal/legal advisor before operating
 * with real third-party money. See the project plan, "Postura de compliance".
 */

/**
 * PLD/AML identification threshold for vehicle sales (LFPIORPI "actividad
 * vulnerable"). ≈ 3,210 UMA ≈ MXN 376,565 (2025). Orders at/above this require
 * a buyer identification file to be retained (10 years).
 */
export const PLD_IDENTIFICATION_THRESHOLD_CENTAVOS = 37_656_500; // MXN 376,565.00

/** Default brokerage commission for third-party cars (basis points). 5%. */
export const DEFAULT_PLATFORM_FEE_BPS = 500;

/** How long an UNPAID checkout soft-reserves a car before the cron releases it. */
export const SOFT_HOLD_MINUTES = 30;

/** How long a PAID deposit ("anticipo") holds a car for offline balance settlement. */
export const DEPOSIT_RESERVATION_HOURS = 48;

/** True when an order's price crosses the PLD identification threshold. */
export function isAmlFlagged(priceCentavos: number): boolean {
  return priceCentavos >= PLD_IDENTIFICATION_THRESHOLD_CENTAVOS;
}
