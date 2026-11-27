import type { EventPayload } from "./types"
import { Kernel } from "./kernel"

type EventHandler = (event: EventPayload) => void

export class EventBus {
  private kernel = Kernel.getInstance()
  private handlers: Map<string, EventHandler[]> = new Map()

  subscribe(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }

    this.handlers.get(eventType)!.push(handler)

    return () => {
      const handlers = this.handlers.get(eventType)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    }
  }

  subscribeAll(handler: EventHandler): () => void {
    return this.subscribe("*", handler)
  }

  async emit(event: Omit<EventPayload, "id" | "timestamp">): Promise<void> {
    const payload: EventPayload = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: 1751990400000,
      ...event,
    }

    this.kernel.recordEvent(event)

    const typeHandlers = this.handlers.get(payload.type) || []
    const wildcardHandlers = this.handlers.get("*") || []
    const allHandlers = [...typeHandlers, ...wildcardHandlers]

    for (const handler of allHandlers) {
      try {
        handler(payload)
      } catch (error) {
        console.error(`Error in event handler for ${payload.type}:`, error)
      }
    }
  }

  getSubscriberCount(eventType: string): number {
    return (this.handlers.get(eventType) || []).length
  }

  getAllSubscriptions(): Record<string, number> {
    const result: Record<string, number> = {}
    for (const [eventType, handlers] of this.handlers.entries()) {
      result[eventType] = handlers.length
    }
    return result
  }

  clearSubscriptions(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType)
    } else {
      this.handlers.clear()
    }
  }

  getEventHistory(eventType?: string, limit: number = 100): EventPayload[] {
    let events = this.kernel.getEvents(limit)
    if (eventType && eventType !== "*") {
      events = events.filter((e) => e.type === eventType)
    }
    return events
  }

  getEventStats(): {
    totalEvents: number
    eventTypes: Record<string, number>
    mostRecentEvent: EventPayload | null
  } {
    const events = this.kernel.getEvents(10000)
    const eventTypes: Record<string, number> = {}

    for (const event of events) {
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1
    }

    return {
      totalEvents: events.length,
      eventTypes,
      mostRecentEvent: events[events.length - 1] || null,
    }
  }
}

export const eventBus = new EventBus()
