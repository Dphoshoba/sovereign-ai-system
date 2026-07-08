import { describe, it, expect } from 'vitest'
import { getKernelRegistry } from '../../lib/gamma/kernel-reader'

describe('Kernel Reader', () => {
  it('should return deterministic kernel workspace', async () => {
    const registry = await getKernelRegistry()
    expect(registry).toBeDefined()
    expect(typeof registry).toBe('object')
  })

  it('should be deterministic across multiple calls', async () => {
    const call1 = await getKernelRegistry()
    const call2 = await getKernelRegistry()
    expect(JSON.stringify(call1)).toBe(JSON.stringify(call2))
  })
})
