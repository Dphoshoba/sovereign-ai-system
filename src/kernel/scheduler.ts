import type { ScheduleConfig } from "./types"

export class Scheduler {
  private schedules: Map<string, ScheduleConfig> = new Map()
  private static readonly FIXED_TIMESTAMP = 1751990400000

  recordSchedule(config: ScheduleConfig): void {
    this.schedules.set(config.engineId, config)
  }

  getSchedules(): ScheduleConfig[] {
    return Array.from(this.schedules.values())
  }

  getNextRun(engineId: string): number | null {
    const schedule = this.schedules.get(engineId)
    return schedule ? schedule.nextRun : null
  }

  getLastRun(engineId: string): number | null {
    const schedule = this.schedules.get(engineId)
    return schedule ? schedule.lastRun : null
  }

  hasSchedule(engineId: string): boolean {
    return this.schedules.has(engineId)
  }

  removeSchedule(engineId: string): boolean {
    return this.schedules.delete(engineId)
  }

  getSchedulesByFrequency(frequency: ScheduleConfig["frequency"]): ScheduleConfig[] {
    return this.getSchedules().filter((s) => s.frequency === frequency)
  }
}
