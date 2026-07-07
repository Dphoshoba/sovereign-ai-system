export interface EventBusEvent {
  id: string
  type: string
  timestamp: number
  source: string
  payload: Record<string, any>
}

export interface EventBusMetrics {
  totalEvents: number
  eventsPerSecond: number
  subscriberCount: number
  queueDepth: number
}

export interface EventBusWorkspace {
  events: EventBusEvent[]
  metrics: EventBusMetrics
  activeSubscriptions: number
}
