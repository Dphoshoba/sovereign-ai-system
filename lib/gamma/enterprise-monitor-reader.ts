import { ENTERPRISE_MONITOR_ASSETS } from "../enterprise-monitor/mock-data"
import type { EnterpriseMonitorWorkspace } from "../enterprise-monitor/types"

export async function getEnterpriseMonitorRegistry(): Promise<EnterpriseMonitorWorkspace> {
  return ENTERPRISE_MONITOR_ASSETS
}
