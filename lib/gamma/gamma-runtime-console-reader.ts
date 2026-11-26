import { getGammaRuntimeConsoleMockData } from '../../src/lib/gamma-runtime-console/mock-data'
import { GammaRuntimeConsole } from '../../src/lib/gamma-runtime-console/types'

export async function getGammaRuntimeConsoleReader(): Promise<GammaRuntimeConsole> {
  return getGammaRuntimeConsoleMockData()
}
