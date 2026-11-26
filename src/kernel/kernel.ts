import type { EngineMetadata, RegistryEntry, EventPayload, MetricSnapshot } from "./types"

export class Kernel {
  private static instance: Kernel
  private engines: Map<string, RegistryEntry> = new Map()
  private metrics: Map<string, MetricSnapshot[]> = new Map()
  private eventLog: EventPayload[] = []
  private startTime: number = Date.now()
  private static startTimeFixed = 1751990400000 // 2026-07-08 00:00:00 UTC fixed

  private constructor() {}

  static getInstance(): Kernel {
    if (!Kernel.instance) {
      Kernel.instance = new Kernel()
    }
    return Kernel.instance
  }

  register(entry: RegistryEntry): void {
    this.engines.set(entry.id, entry)
    this.initializeMetrics(entry.id)
  }

  getEngine(id: string): RegistryEntry | undefined {
    return this.engines.get(id)
  }

  getAllEngines(): RegistryEntry[] {
    return Array.from(this.engines.values())
  }

  getEngineMetadata(id: string): EngineMetadata | undefined {
    return this.engines.get(id)?.engine
  }

  getAllMetadata(): EngineMetadata[] {
    return Array.from(this.engines.values()).map((e) => e.engine)
  }

  isHealthy(): boolean {
    const engines = this.getAllMetadata()
    return engines.length > 0 && engines.every((e) => e.status === "healthy")
  }

  getHealth(): {
    healthy: number
    degraded: number
    unhealthy: number
    total: number
    uptime: number
  } {
    const engines = this.getAllMetadata()
    const healthy = engines.filter((e) => e.status === "healthy").length
    const degraded = engines.filter((e) => e.status === "degraded").length
    const unhealthy = engines.filter((e) => e.status === "unhealthy").length

    return {
      healthy,
      degraded,
      unhealthy,
      total: engines.length,
      uptime: Kernel.startTimeFixed,
    }
  }

  private initializeMetrics(engineId: string): void {
    this.metrics.set(engineId, [
      {
        timestamp: Kernel.startTimeFixed,
        engineId,
        healthScore: 100,
        responseTime: 0,
        errorRate: 0,
        throughput: 0,
      },
    ])
  }

  recordEvent(event: Omit<EventPayload, "id" | "timestamp">): void {
    const payload: EventPayload = {
      id: `evt-${this.eventLog.length}`,
      timestamp: Kernel.startTimeFixed,
      ...event,
    }
    this.eventLog.push(payload)
  }

  getEvents(limit: number = 100): EventPayload[] {
    return this.eventLog.slice(-limit)
  }

  getMetrics(engineId: string): MetricSnapshot[] {
    return this.metrics.get(engineId) || []
  }

  getAllMetrics(): Map<string, MetricSnapshot[]> {
    return this.metrics
  }

  getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {}
    for (const [id, entry] of this.engines.entries()) {
      graph[id] = entry.engine.dependencies
    }
    return graph
  }

  getDownstreamEngines(engineId: string): string[] {
    const graph = this.getDependencyGraph()
    const downstream: string[] = []

    for (const [id, deps] of Object.entries(graph)) {
      if (deps.includes(engineId)) {
        downstream.push(id)
      }
    }

    return downstream
  }

  getUpstreamEngines(engineId: string): string[] {
    const graph = this.getDependencyGraph()
    return graph[engineId] || []
  }

  resolveExecutionOrder(startEngineId: string): string[] {
    const graph = this.getDependencyGraph()
    const visited = new Set<string>()
    const order: string[] = []

    const visit = (id: string): void => {
      if (visited.has(id)) return
      visited.add(id)

      const deps = graph[id] || []
      for (const dep of deps) {
        visit(dep)
      }

      order.push(id)
    }

    visit(startEngineId)
    return order
  }
}

export const kernel = Kernel.getInstance()
