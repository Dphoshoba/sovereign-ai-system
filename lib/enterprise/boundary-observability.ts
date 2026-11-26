import { buildEnterpriseGuardReadinessAudit } from "./enterprise-readiness-audit"

export type BoundaryObservabilitySignal = {
  id: string
  boundary: string
  signalType: "score" | "constraint" | "warning"
  explainable: boolean
  telemetryBackend: "not-integrated"
  persistence: false
}

export function buildBoundaryObservabilitySignals(): BoundaryObservabilitySignal[] {
  const audit = buildEnterpriseGuardReadinessAudit()

  return [
    {
      id: "guard-coverage-signal",
      boundary: "guard coverage",
      signalType: "score",
      explainable: true,
      telemetryBackend: "not-integrated",
      persistence: false,
    },
    {
      id: "tenant-isolation-signal",
      boundary: `tenant isolation ${audit.tenantIsolationScore}`,
      signalType: "score",
      explainable: true,
      telemetryBackend: "not-integrated",
      persistence: false,
    },
    {
      id: "shared-knowledge-constraint-signal",
      boundary: "shared knowledge writes blocked",
      signalType: "constraint",
      explainable: true,
      telemetryBackend: "not-integrated",
      persistence: false,
    },
    {
      id: "legacy-governance-warning-signal",
      boundary: "legacy enterprise governance write routes",
      signalType: "warning",
      explainable: true,
      telemetryBackend: "not-integrated",
      persistence: false,
    },
  ]
}

export function evaluateGuardObservability(
  signals: BoundaryObservabilitySignal[] = buildBoundaryObservabilitySignals()
) {
  const explainable = signals.every((signal) => signal.explainable)
  const noBackend = signals.every((signal) => signal.telemetryBackend === "not-integrated")
  const noPersistence = signals.every((signal) => signal.persistence === false)

  return {
    score: explainable && noBackend && noPersistence ? 88 : 55,
    status: "OBSERVABLE_BY_CONTRACT_NO_BACKEND" as const,
    signalCount: signals.length,
    explainable,
    telemetryBackendIntegrated: false,
    persistence: false,
  }
}

