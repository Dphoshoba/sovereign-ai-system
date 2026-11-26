import { ProviderAdapter, AdapterValidationResult } from "./provider-adapter";
import {
  ConnectorCapabilityProfile,
  OperationCapability,
} from "../capability-contract";

export class AdapterValidator {
  validate(adapter: ProviderAdapter): AdapterValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!adapter.providerId) {
      errors.push('MISSING_PROVIDER_ID: providerId is required');
    } else if (typeof adapter.providerId !== 'string') {
      errors.push('INVALID_PROVIDER_ID: providerId must be a string');
    }

    if (!adapter.providerVersion) {
      errors.push('MISSING_PROVIDER_VERSION: providerVersion is required');
    }

    if (!adapter.supportedOperations || adapter.supportedOperations.length === 0) {
      warnings.push('NO_OPERATIONS: adapter supports no operations');
    }

    if (typeof adapter.initialize !== 'function') {
      errors.push('MISSING_INITIALIZE: initialize() must be implemented');
    }

    if (typeof adapter.validate !== 'function') {
      errors.push('MISSING_VALIDATE: validate() must be implemented');
    }

    if (typeof adapter.dispose !== 'function') {
      errors.push('MISSING_DISPOSE: dispose() must be implemented');
    }

    if (typeof adapter.getCapabilityProfile !== 'function') {
      errors.push('MISSING_CAPABILITY_PROFILE: getCapabilityProfile() must be implemented');
    }

    if (errors.length === 0) {
      const profile = adapter.getCapabilityProfile();

      if (profile.connectorId !== adapter.providerId) {
        warnings.push(
          `CAPABILITY_MISMATCH: capability profile connectorId '${profile.connectorId}' differs from adapter providerId '${adapter.providerId}'`,
        );
      }

      for (const op of profile.supportedOperations) {
        if (!adapter.supportedOperations.includes(op.operation)) {
          warnings.push(
            `OPERATION_DECLARATION_MISMATCH: operation '${op.operation}' in capability profile but not in supportedOperations`,
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
