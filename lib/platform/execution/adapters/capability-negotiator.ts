import { ProviderAdapter, AdapterConfig } from "./provider-adapter";
import {
  ConnectorCapabilityProfile,
  OperationCapability,
  RiskLevel,
  ApprovalLevel,
} from "../capability-contract";
import { ConnectorRuntimeCapabilities } from "../capabilities";

export interface NegotiatedCapabilities {
  adapterProfile: ConnectorCapabilityProfile;
  runtimeCapabilities: ConnectorRuntimeCapabilities;
  resolvedOperations: OperationCapability[];
  conflicts: string[];
  warnings: string[];
}

export class CapabilityNegotiator {
  negotiate(
    adapter: ProviderAdapter,
    runtimeCapabilities: ConnectorRuntimeCapabilities,
  ): NegotiatedCapabilities {
    const adapterProfile = adapter.getCapabilityProfile();
    const conflicts: string[] = [];
    const warnings: string[] = [];
    const resolvedOperations: OperationCapability[] = [];

    for (const op of adapterProfile.supportedOperations) {
      if (!runtimeCapabilities.execute && op.canExecute) {
        warnings.push(
          `Operation '${op.operation}': runtime does not allow execution, marking as simulation-only`,
        );
      }

      if (
        op.riskLevel === 'DESTRUCTIVE' &&
        !runtimeCapabilities.providerMutationAllowed
      ) {
        conflicts.push(
          `Operation '${op.operation}': destructive but provider mutations are disabled`,
        );
        continue;
      }

      resolvedOperations.push(op);
    }

    if (adapterProfile.supportedOperations.length === 0) {
      warnings.push('Adapter declares no supported operations');
    }

    return {
      adapterProfile,
      runtimeCapabilities,
      resolvedOperations,
      conflicts,
      warnings,
    };
  }
}
