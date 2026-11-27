import { Kernel } from "./kernel"
import type { EngineMetadata, RegistryEntry } from "./types"

export class Registry {
  private kernel = Kernel.getInstance()

  async registerEngine(
    id: string,
    name: string,
    version: string,
    dependencies: string[] = [],
    reader: (slug: string) => Promise<any>,
    registry: () => Promise<any>
  ): Promise<void> {
    const metadata: EngineMetadata = {
      id,
      name,
      version,
      status: "healthy",
      dependencies,
      readyAt: 1751990400000,
      healthScore: 100,
    }

    const entry: RegistryEntry = {
      id,
      engine: metadata,
      reader,
      registry,
    }

    this.kernel.register(entry)
  }

  async getEngineRegistry(engineId: string): Promise<any | null> {
    const entry = this.kernel.getEngine(engineId)
    if (!entry) return null

    try {
      return await entry.registry()
    } catch (error) {
      console.error(`Failed to get registry for ${engineId}:`, error)
      return null
    }
  }

  async getMissionReader(engineId: string, slug: string): Promise<any | null> {
    const entry = this.kernel.getEngine(engineId)
    if (!entry) return null

    try {
      return await entry.reader(slug)
    } catch (error) {
      console.error(`Failed to read mission ${slug} from ${engineId}:`, error)
      return null
    }
  }

  getAllEngines(): EngineMetadata[] {
    return this.kernel.getAllMetadata()
  }

  getEngine(engineId: string): EngineMetadata | undefined {
    return this.kernel.getEngineMetadata(engineId)
  }

  findEnginesByName(namePattern: string): EngineMetadata[] {
    const regex = new RegExp(namePattern, "i")
    return this.kernel.getAllMetadata().filter((e) => regex.test(e.name))
  }

  findEnginesByDependency(dependencyId: string): EngineMetadata[] {
    return this.kernel
      .getAllMetadata()
      .filter((e) => e.dependencies.includes(dependencyId))
  }

  getEngineVersion(engineId: string): string | null {
    const engine = this.kernel.getEngineMetadata(engineId)
    return engine?.version || null
  }

  getRegistrySnapshot(): {
    totalEngines: number
    healthyEngines: number
    engines: Array<{
      id: string
      name: string
      version: string
      status: string
      dependencyCount: number
    }>
  } {
    const engines = this.kernel.getAllMetadata()
    return {
      totalEngines: engines.length,
      healthyEngines: engines.filter((e) => e.status === "healthy").length,
      engines: engines.map((e) => ({
        id: e.id,
        name: e.name,
        version: e.version,
        status: e.status,
        dependencyCount: e.dependencies.length,
      })),
    }
  }
}

export const registry = new Registry()
