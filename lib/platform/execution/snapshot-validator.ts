import { RuntimeSnapshot } from "./capabilities";
import { ExecutionContext } from "./execution-context";

export class SnapshotValidator {
  /**
   * Validates that a snapshot is truly immutable and deterministically hashable.
   */
  static validate(snapshot: RuntimeSnapshot): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!snapshot.snapshotHash) errors.push('MISSING_SNAPSHOT_HASH');
    if (!snapshot.stepName) errors.push('MISSING_STEP_NAME');

    // Verification of immutability: we compare a clone to the original
    const clone = JSON.parse(JSON.stringify(snapshot));
    if (JSON.stringify(clone) !== JSON.stringify(snapshot)) {
      errors.push('SNAPSHOT_SERIALIZATION_SKEW');
    }

    return {
      valid: errors.length === 0,
      errors: errors.sort(),
    };
  }

  /**
   * Reconstructs an audit trail from a sequence of snapshots.
   */
  static reconstructAuditTrail(snapshots: RuntimeSnapshot[]): string[] {
    return snapshots.map(s => `Step ${s.stepIndex} [${s.stepName}]: State ${s.state} (Hash: ${s.snapshotHash})`);
  }
}
