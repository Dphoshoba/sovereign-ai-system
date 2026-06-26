export type TelemetryOptionName =
  | "OpenTelemetry"
  | "Sentry"
  | "PostHog"
  | "Vercel Analytics"
  | "structured logs"

export type TelemetryOption = {
  option: TelemetryOptionName
  score: number
  fit: "HIGH" | "MEDIUM" | "LOW"
  captures: string[]
  tradeoffs: string[]
  enabled: false
}

export type TelemetryStrategy = {
  ok: true
  readOnly: true
  writesToPrisma: false
  telemetryRecommendation: string
  telemetryReadiness: number
  persistenceEnabled: false
  options: TelemetryOption[]
  eventPriorities: string[]
}

const options: TelemetryOption[] = [
  telemetry("OpenTelemetry", 82, "HIGH", [
    "traces",
    "spans",
    "service boundaries",
  ], [
    "Requires collector/exporter decisions.",
  ]),
  telemetry("Sentry", 86, "HIGH", [
    "errors",
    "performance",
    "release health",
  ], [
    "Adds external monitoring dependency.",
  ]),
  telemetry("PostHog", 70, "MEDIUM", [
    "product analytics",
    "operator behavior",
  ], [
    "Less central for backend guardrail confidence than errors/traces.",
  ]),
  telemetry("Vercel Analytics", 72, "MEDIUM", [
    "deployment and traffic signals",
  ], [
    "Not enough alone for governed backend audit trails.",
  ]),
  telemetry("structured logs", 84, "HIGH", [
    "guardrail events",
    "approval boundary decisions",
    "rate-limit decisions",
  ], [
    "Needs destination, retention, and redaction policy.",
  ]),
]

export function buildTelemetryStrategy(): TelemetryStrategy {
  const telemetryReadiness = Math.round(
    options.reduce((sum, item) => sum + item.score, 0) / options.length
  )

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    telemetryRecommendation:
      "Use Sentry plus structured logs first, then add OpenTelemetry for deeper traces once route guards are enforced.",
    telemetryReadiness,
    persistenceEnabled: false,
    options,
    eventPriorities: [
      "operator intent attempts",
      "authorization failures",
      "rate-limit decisions",
      "approval boundary decisions",
      "graph write gate failures",
      "publishing/social posting blocks",
      "startup gate results",
    ],
  }
}

function telemetry(
  name: TelemetryOptionName,
  score: number,
  fit: TelemetryOption["fit"],
  captures: string[],
  tradeoffs: string[]
): TelemetryOption {
  return {
    option: name,
    score,
    fit,
    captures,
    tradeoffs,
    enabled: false,
  }
}
