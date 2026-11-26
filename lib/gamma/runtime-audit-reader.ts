import { getRuntimeAuditMockData } from '../../src/lib/runtime-audit/mock-data'
import { RuntimeAudit } from '../../src/lib/runtime-audit/types'

export async function getRuntimeAuditReader(): Promise<RuntimeAudit> {
  return getRuntimeAuditMockData()
}
