import { getExecutionSimulatorMockData } from '../../src/lib/execution-simulator/mock-data'
import { ExecutionSimulator } from '../../src/lib/execution-simulator/types'

export async function getExecutionSimulatorReader(): Promise<ExecutionSimulator> {
  return getExecutionSimulatorMockData()
}
