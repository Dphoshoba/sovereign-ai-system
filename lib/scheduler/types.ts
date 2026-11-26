export interface ScheduleConfig {
  id: string
  name: string
  pattern: string
  enabled: boolean
  lastRun: number
  nextRun: number
}

export interface SchedulerMetrics {
  totalSchedules: number
  activeSchedules: number
  executedTasks: number
  failedTasks: number
}

export interface SchedulerWorkspace {
  schedules: ScheduleConfig[]
  metrics: SchedulerMetrics
}
