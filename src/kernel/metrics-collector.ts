import type { MetricSnapshot } from "./types"

export interface Metric {
  engineId: string
  name: string
  value: number
  unit: string
  timestamp: number
}

export class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map()
  private static readonly FIXED_TIMESTAMP = 1751990400000

  recordMetric(engineId: string, metric: Omit<Metric, "timestamp">): void {
    const fullMetric: Metric = {
      ...metric,
      timestamp: MetricsCollector.FIXED_TIMESTAMP,
    }

    if (!this.metrics.has(engineId)) {
      this.metrics.set(engineId, [])
    }

    this.metrics.get(engineId)!.push(fullMetric)
  }

  recordSnapshot(snapshot: MetricSnapshot): void {
    const engineId = snapshot.engineId

    if (!this.metrics.has(engineId)) {
      this.metrics.set(engineId, [])
    }

    const metric: Metric = {
      engineId,
      name: "snapshot",
      value: snapshot.healthScore,
      unit: "score",
      timestamp: snapshot.timestamp,
    }

    this.metrics.get(engineId)!.push(metric)
  }

  getMetrics(engineId: string): Metric[] {
    return this.metrics.get(engineId) || []
  }

  getMetricsByName(engineId: string, name: string): Metric[] {
    return this.getMetrics(engineId).filter((m) => m.name === name)
  }

  getAllMetrics(): Metric[] {
    return Array.from(this.metrics.values()).flat()
  }

  getEngineMetrics(engineId: string): {
    engineId: string
    count: number
    lastMetric?: Metric
    averageValue: number
  } {
    const metrics = this.getMetrics(engineId)
    const lastMetric = metrics[metrics.length - 1]
    const averageValue = metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length : 0

    return {
      engineId,
      count: metrics.length,
      lastMetric,
      averageValue,
    }
  }

  clearMetrics(engineId?: string): void {
    if (engineId) {
      this.metrics.delete(engineId)
    } else {
      this.metrics.clear()
    }
  }

  getStats(): {
    totalEngines: number
    totalMetrics: number
    avgMetricsPerEngine: number
  } {
    const totalEngines = this.metrics.size
    const totalMetrics = Array.from(this.metrics.values()).reduce((sum, metrics) => sum + metrics.length, 0)
    const avgMetricsPerEngine = totalEngines > 0 ? totalMetrics / totalEngines : 0

    return {
      totalEngines,
      totalMetrics,
      avgMetricsPerEngine,
    }
  }
}
