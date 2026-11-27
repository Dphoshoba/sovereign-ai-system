export type RuntimeStage = '3A' | '3B' | '3C';

export interface ConnectorRuntimeCapabilities {
  prepare: boolean;
  preflight: boolean;
  execute: boolean;
  verify: boolean;
  rollback: boolean;
  audit: boolean;
  stage: RuntimeStage;
  providerMutationAllowed: boolean;
  networkMutationAllowed: boolean;
}

export interface RuntimeCapabilityRegistry {
  [connectorId: string]: ConnectorRuntimeCapabilities;
}

export type RuntimeHash = string;

export interface RuntimeSnapshot<TContext = unknown> {
  readonly stepIndex: number;
  readonly stepName: string;
  readonly state: string;
  readonly context: TContext;
  readonly snapshotHash: RuntimeHash;
  readonly timestamp: string;
}
