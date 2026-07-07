import { EVENT_BUS_ASSETS } from "../event-bus/mock-data"
import type { EventBusWorkspace } from "../event-bus/types"

export async function getEventBusRegistry(): Promise<EventBusWorkspace> {
  return EVENT_BUS_ASSETS
}
