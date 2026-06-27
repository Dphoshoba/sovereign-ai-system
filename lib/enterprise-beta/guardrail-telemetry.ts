export type GuardrailTelemetrySignal = {
  id: string
  signal:
    | "tenant-auth-error-rate"
    | "tenant-claim-mismatch-rate"
    | "operator-approval-latency"
    | "rollback-trigger-rate"
  thresholdDefined: boolean
  required: boolean
  reportOnly: true
}

export function buildGuardrailTelemetrySignals(): GuardrailTelemetrySignal[] {
  return [
    {
      id: "telemetry-auth-error-rate",
      signal: "tenant-auth-error-rate",
      thresholdDefined: true,
      required: true,
      reportOnly: true,
    },
    {
      id: "telemetry-claim-mismatch-rate",
      signal: "tenant-claim-mismatch-rate",
      thresholdDefined: true,
      required: true,
      reportOnly: true,
    },
    {
      id: "telemetry-approval-latency",
      signal: "operator-approval-latency",
      thresholdDefined: true,
      required: true,
      reportOnly: true,
    },
    {
      id: "telemetry-rollback-trigger-rate",
      signal: "rollback-trigger-rate",
      thresholdDefined: true,
      required: true,
      reportOnly: true,
    },
  ]
}

export function evaluateTelemetryCoverage(
  signals: GuardrailTelemetrySignal[] = buildGuardrailTelemetrySignals()
) {
  const required = signals.filter((signal) => signal.required).length
  const thresholdDefined = signals.filter((signal) => signal.thresholdDefined).length

  return {
    score: Math.round((required / signals.length) * 45 + (thresholdDefined / signals.length) * 45),
    status: "GUARDRAIL_TELEMETRY_DEFINED_REPORT_ONLY" as const,
    signalCount: signals.length,
  }
}
