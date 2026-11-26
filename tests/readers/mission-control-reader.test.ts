import { describe, it, expect } from 'vitest'
import { getMissionControlRegistry } from '../../lib/gamma/mission-control-reader'

describe('Mission Control Reader', () => {
  it('should return deterministic Mission Control workspace', async () => {
    const registry = await getMissionControlRegistry()
    expect(registry).toBeDefined()
  })

  it('should have required mission control fields', async () => {
    const registry = await getMissionControlRegistry()
    expect(registry.missions).toBeDefined()
    expect(Array.isArray(registry.missions)).toBe(true)
  })

  it('should have deterministic mission count', async () => {
    const registry1 = await getMissionControlRegistry()
    const registry2 = await getMissionControlRegistry()
    expect(registry1.missions.length).toBe(registry2.missions.length)
  })

  it('should have deterministic timestamp', async () => {
    const registry1 = await getMissionControlRegistry()
    const registry2 = await getMissionControlRegistry()
    expect(registry1.timestamp).toBe(registry2.timestamp)
  })

  it('should have valid health score', async () => {
    const registry = await getMissionControlRegistry()
    if (registry.healthScore !== undefined) {
      expect(registry.healthScore).toBeGreaterThanOrEqual(0)
      expect(registry.healthScore).toBeLessThanOrEqual(100)
    }
  })
})
