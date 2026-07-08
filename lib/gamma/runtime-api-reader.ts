import { getRuntimeAPIMockData } from '../../src/lib/runtime-api/mock-data'
import { RuntimeAPI } from '../../src/lib/runtime-api/types'

export async function getRuntimeAPIReader(): Promise<RuntimeAPI> {
  return getRuntimeAPIMockData()
}
