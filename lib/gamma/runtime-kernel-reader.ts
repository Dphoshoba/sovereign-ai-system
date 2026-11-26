import { getRuntimeKernelMockData } from '../../src/lib/runtime-kernel/mock-data'
import { RuntimeKernelRegistry } from '../../src/lib/runtime-kernel/types'

export async function getRuntimeKernelRegistry(): Promise<RuntimeKernelRegistry> {
  return getRuntimeKernelMockData()
}
