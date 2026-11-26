import { getSafeExecutionPolicyMockData } from '../../src/lib/safe-execution-policy/mock-data'
import { SafeExecutionPolicy } from '../../src/lib/safe-execution-policy/types'

export async function getSafeExecutionPolicyReader(): Promise<SafeExecutionPolicy> {
  return getSafeExecutionPolicyMockData()
}
