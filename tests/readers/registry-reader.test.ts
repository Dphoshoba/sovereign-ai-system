import { describe, it, expect } from 'vitest'
import { getRegistryRegistry } from '../../lib/gamma/registry-reader'

describe('Registry Reader', () => {
  it('should return deterministic registry workspace', async () => {
    const registry = await getRegistryRegistry()
    expect(registry).toBeDefined()
    expect(typeof registry).toBe('object')
  })

  it('should be deterministic across multiple calls', async () => {
    const call1 = await getRegistryRegistry()
    const call2 = await getRegistryRegistry()
    expect(JSON.stringify(call1)).toBe(JSON.stringify(call2))
  })

  it('should return valid object', async () => {
    const registry = await getRegistryRegistry()
    expect(Object.keys(registry).length).toBeGreaterThan(0)
  })
})
