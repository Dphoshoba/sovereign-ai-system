import { describe, it, expect } from 'vitest'
import { getGammaCloudRegistry } from '../../lib/gamma/gamma-cloud-reader'

describe('Gamma Cloud Reader', () => {
  it('should return deterministic Gamma Cloud workspace', async () => {
    const registry = await getGammaCloudRegistry()
    expect(registry).toBeDefined()
    expect(typeof registry).toBe('object')
  })

  it('should be deterministic across multiple calls', async () => {
    const call1 = await getGammaCloudRegistry()
    const call2 = await getGammaCloudRegistry()
    expect(JSON.stringify(call1)).toBe(JSON.stringify(call2))
  })

  it('should have valid structure', async () => {
    const registry = await getGammaCloudRegistry()
    // Check that it returns an object with expected top-level keys
    expect(Object.keys(registry).length).toBeGreaterThan(0)
  })
})
