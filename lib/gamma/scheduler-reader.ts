import { SCHEDULER_ASSETS } from "../scheduler/mock-data"
import type { SchedulerWorkspace } from "../scheduler/types"

export async function getSchedulerRegistry(): Promise<SchedulerWorkspace> {
  return SCHEDULER_ASSETS
}
