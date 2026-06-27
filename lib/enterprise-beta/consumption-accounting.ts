export type ConsumptionMetric = {
  id: string
  name: string
  unit: "request" | "package" | "decision" | "preview"
  tenantScoped: boolean
  operatorScoped: boolean
  persisted: false
}

export function buildConsumptionMetrics(): ConsumptionMetric[] {
  return [
    {
      id: "metric-preview-requests",
      name: "Preview requests",
      unit: "request",
      tenantScoped: true,
      operatorScoped: true,
      persisted: false,
    },
    {
      id: "metric-intent-packages",
      name: "Intent packages",
      unit: "package",
      tenantScoped: true,
      operatorScoped: true,
      persisted: false,
    },
    {
      id: "metric-review-decisions",
      name: "Review decisions",
      unit: "decision",
      tenantScoped: true,
      operatorScoped: true,
      persisted: false,
    },
    {
      id: "metric-guard-previews",
      name: "Guard previews",
      unit: "preview",
      tenantScoped: true,
      operatorScoped: true,
      persisted: false,
    },
  ]
}

export function evaluateUsageCoverage(metrics: ConsumptionMetric[] = buildConsumptionMetrics()) {
  const scoped = metrics.filter((metric) => metric.tenantScoped && metric.operatorScoped).length

  return {
    score: Math.round((scoped / metrics.length) * 86),
    status: "CONSUMPTION_ACCOUNTING_MODELED_NOT_PERSISTED" as const,
    metricCount: metrics.length,
    persisted: false,
  }
}
