import type { RepuveStatus } from '@prisma/client';

/**
 * Vehicle legal-verification seam (Buró Vehicular).
 *
 * Phase 1: verification is MANUAL/external — an admin runs the check in Buró
 * Vehicular's own software and records the result (outcome + REPUVE status +
 * report URL) via the admin panel. This interface documents the seam so the
 * Buró Vehicular API can be plugged in later without touching the rest of the app.
 */
export type VerificationOutcome = 'APPROVED' | 'REJECTED';

export interface VehicleVerificationInput {
  carId: string;
  vin?: string | null;
  plate?: string | null;
}

export interface VerificationResult {
  outcome: VerificationOutcome;
  repuveStatus: RepuveStatus;
  reportUrl?: string;
  checkedAt: Date;
}

export interface VerificationProvider {
  readonly id: string;
  verify(input: VehicleVerificationInput): Promise<VerificationResult>;
}

/** Phase 1 implementation: results are recorded by an admin, not auto-fetched. */
export class ManualVerificationProvider implements VerificationProvider {
  readonly id = 'manual';

  async verify(): Promise<VerificationResult> {
    throw new Error(
      'Manual verification: record the result via the admin panel (recordCarVerification), ' +
        'not by auto-running this provider.',
    );
  }
}

export const verificationProvider: VerificationProvider = new ManualVerificationProvider();
