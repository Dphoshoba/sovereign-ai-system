export type AuditStorageStrategy = {
  id: string
  name: string
  candidate: "database-table" | "append-only-ledger" | "object-archive" | "external-siem"
  strengths: string[]
  risks: string[]
  recommendedFor: string[]
  implementationMode: "PLANNED"
}

export function buildAuditStorageStrategies(): AuditStorageStrategy[] {
  return [
    {
      id: "storage-existing-db",
      name: "Existing database-backed audit model",
      candidate: "database-table",
      strengths: ["Fastest controlled implementation", "Simple query path"],
      risks: ["May not satisfy immutability without additional controls"],
      recommendedFor: ["operator intent", "review package linkage"],
      implementationMode: "PLANNED",
    },
    {
      id: "storage-append-ledger",
      name: "Append-only audit ledger",
      candidate: "append-only-ledger",
      strengths: ["Strong immutability posture", "Clear compliance chain"],
      risks: ["Requires schema or external service planning"],
      recommendedFor: ["guard decisions", "security events"],
      implementationMode: "PLANNED",
    },
    {
      id: "storage-object-archive",
      name: "Evidence object archive",
      candidate: "object-archive",
      strengths: ["Good for larger evidence packets", "Retention policy alignment"],
      risks: ["Needs access control and redaction pipeline"],
      recommendedFor: ["evidence packets", "decision bundles"],
      implementationMode: "PLANNED",
    },
  ]
}

export function evaluateStorageCoverage(
  strategies: AuditStorageStrategy[] = buildAuditStorageStrategies()
) {
  const candidates = new Set(strategies.map((strategy) => strategy.candidate)).size
  const recommended = strategies.filter((strategy) => strategy.recommendedFor.length > 0).length

  return {
    score: Math.round((recommended / strategies.length) * 62 + candidates * 8),
    status: "STORAGE_STRATEGY_DEFINED_NOT_IMPLEMENTED" as const,
    strategyCount: strategies.length,
    implementationActive: false,
  }
}
