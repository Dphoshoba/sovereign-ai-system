import type { EventBusWorkspace } from "./types"

export const EVENT_BUS_ASSETS: EventBusWorkspace = {
  events: [
    {
      id: "evt-001",
      type: "system.startup",
      timestamp: 1751990400000,
      source: "kernel",
      payload: { message: "System initialized" },
    },
    {
      id: "evt-002",
      type: "service.registered",
      timestamp: 1751990410000,
      source: "registry",
      payload: { service: "auth-service" },
    },
    {
      id: "evt-003",
      type: "data.processed",
      timestamp: 1751990420000,
      source: "processor",
      payload: { records: 1000 },
    },
  ],
  metrics: {
    totalEvents: 3,
    eventsPerSecond: 5,
    subscriberCount: 12,
    queueDepth: 0,
  },
  activeSubscriptions: 12,
}
