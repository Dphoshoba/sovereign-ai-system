import type { SchedulerWorkspace } from "./types"

export const SCHEDULER_ASSETS: SchedulerWorkspace = {
  schedules: [
    {
      id: "sched-001",
      name: "Daily Backup",
      pattern: "0 2 * * *",
      enabled: true,
      lastRun: 1751990400000,
      nextRun: 1752076800000,
    },
    {
      id: "sched-002",
      name: "Hourly Sync",
      pattern: "0 * * * *",
      enabled: true,
      lastRun: 1751987200000,
      nextRun: 1751990800000,
    },
  ],
  metrics: {
    totalSchedules: 2,
    activeSchedules: 2,
    executedTasks: 48,
    failedTasks: 0,
  },
}
