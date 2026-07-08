import type { EngineMetadata } from "./types"

export interface DependencyGraph {
  engineId: string
  dependencies: string[]
  dependents: string[]
}

export class DependencyResolver {
  private graph: Map<string, DependencyGraph> = new Map()

  registerDependency(engineId: string, dependencies: string[]): void {
    if (!this.graph.has(engineId)) {
      this.graph.set(engineId, {
        engineId,
        dependencies: [],
        dependents: [],
      })
    }

    const node = this.graph.get(engineId)!
    node.dependencies = dependencies

    // Update dependents for each dependency
    dependencies.forEach((depId) => {
      if (!this.graph.has(depId)) {
        this.graph.set(depId, {
          engineId: depId,
          dependencies: [],
          dependents: [],
        })
      }

      const depNode = this.graph.get(depId)!
      if (!depNode.dependents.includes(engineId)) {
        depNode.dependents.push(engineId)
      }
    })
  }

  resolveDependencies(engineId: string): string[] {
    const node = this.graph.get(engineId)
    if (!node) return []

    return [...node.dependencies]
  }

  getTransitiveDependencies(engineId: string): string[] {
    const visited = new Set<string>()
    const stack = [engineId]

    while (stack.length > 0) {
      const current = stack.pop()!

      if (visited.has(current)) continue
      visited.add(current)

      const node = this.graph.get(current)
      if (node) {
        node.dependencies.forEach((dep) => {
          if (!visited.has(dep)) {
            stack.push(dep)
          }
        })
      }
    }

    visited.delete(engineId)
    return Array.from(visited)
  }

  detectCycles(): string[][] {
    const cycles: string[][] = []

    for (const [engineId] of this.graph) {
      const visited = new Set<string>()
      const path: string[] = []

      if (this.hasCycleDFS(engineId, visited, path)) {
        cycles.push([...path])
      }
    }

    return cycles
  }

  private hasCycleDFS(engineId: string, visited: Set<string>, path: string[]): boolean {
    if (path.includes(engineId)) {
      return true
    }

    if (visited.has(engineId)) {
      return false
    }

    visited.add(engineId)
    path.push(engineId)

    const node = this.graph.get(engineId)
    if (node) {
      for (const dep of node.dependencies) {
        if (this.hasCycleDFS(dep, visited, path)) {
          return true
        }
      }
    }

    path.pop()
    return false
  }

  topologicalSort(): string[] {
    const visited = new Set<string>()
    const result: string[] = []

    const visit = (engineId: string) => {
      if (visited.has(engineId)) return

      visited.add(engineId)

      const node = this.graph.get(engineId)
      if (node) {
        node.dependencies.forEach((dep) => visit(dep))
      }

      result.push(engineId)
    }

    for (const [engineId] of this.graph) {
      visit(engineId)
    }

    return result.reverse()
  }

  getDependencyGraph(engineId: string): DependencyGraph | undefined {
    return this.graph.get(engineId)
  }

  getAllGraphs(): DependencyGraph[] {
    return Array.from(this.graph.values())
  }

  getDownstreamDependents(engineId: string): string[] {
    const visited = new Set<string>()
    const stack = [engineId]

    while (stack.length > 0) {
      const current = stack.pop()!

      if (visited.has(current)) continue
      visited.add(current)

      const node = this.graph.get(current)
      if (node) {
        node.dependents.forEach((dep) => {
          if (!visited.has(dep)) {
            stack.push(dep)
          }
        })
      }
    }

    visited.delete(engineId)
    return Array.from(visited)
  }
}
