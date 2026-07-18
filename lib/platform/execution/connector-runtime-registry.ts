import { QueueCandidate } from "../queue/types";

export type ConnectorRuntimeResult = Readonly<Record<string, unknown>>;

export interface ConnectorRuntime {
  prepare(candidate: QueueCandidate): Promise<void>;
  execute(candidate: QueueCandidate): Promise<ConnectorRuntimeResult>;
  verify(
    candidate: QueueCandidate,
    result: ConnectorRuntimeResult,
  ): Promise<ConnectorRuntimeResult>;
  rollback?(candidate: QueueCandidate, error: Error): Promise<void>;
  audit(
    candidate: QueueCandidate,
    result: ConnectorRuntimeResult,
  ): Promise<ConnectorRuntimeResult>;
}

export class ConnectorRuntimeRegistry {
  private static registries = new Map<string, ConnectorRuntime>();

  static register(connectorId: string, runtime: ConnectorRuntime) {
    this.registries.set(connectorId, runtime);
  }

  static getRuntime(connectorId: string): ConnectorRuntime | undefined {
    return this.registries.get(connectorId);
  }

  static getAllRegisteredConnectors(): string[] {
    return Array.from(this.registries.keys()).sort();
  }

  static clear(): void {
    this.registries.clear();
  }
}
