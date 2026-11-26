import { describe, it, expect } from 'vitest'
import { getEnterpriseMonitorRegistry } from '../../lib/gamma/enterprise-monitor-reader'

describe('Enterprise Monitor Reader', () => {
  it('should return deterministic enterprise monitor workspace', async () => {
    const registry = await getEnterpriseMonitorRegistry()
    expect(registry).toBeDefined()
    expect(typeof registry).toBe('object')
  })

  it('should be deterministic across multiple calls', async () => {
    const call1 = await getEnterpriseMonitorRegistry()
    const call2 = await getEnterpriseMonitorRegistry()
    expect(JSON.stringify(call1)).toBe(JSON.stringify(call2))
  })

  it('should return valid data structure', async () => {
    const registry = await getEnterpriseMonitorRegistry()
    // Verify it's a non-empty object
    expect(Object.keys(registry).length).toBeGreaterThan(0)
  })
})
