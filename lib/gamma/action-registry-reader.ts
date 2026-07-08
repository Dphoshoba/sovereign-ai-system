import { getActionRegistryMockData } from '../../src/lib/action-registry/mock-data'
import { ActionRegistry } from '../../src/lib/action-registry/types'

export async function getActionRegistryReader(): Promise<ActionRegistry> {
  return getActionRegistryMockData()
}
