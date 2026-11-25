import { getRuntimeQueueMockData } from '../../src/lib/runtime-queue/mock-data'
import { RuntimeQueue } from '../../src/lib/runtime-queue/types'

export async function getRuntimeQueueReader(): Promise<RuntimeQueue> {
  return getRuntimeQueueMockData()
}
