export type LogLevel = "debug" | "info" | "warn" | "error"

export interface LogEntry {
  level: LogLevel
  message: string
  data?: Record<string, any>
  timestamp: number
}

export class Logger {
  private logs: LogEntry[] = []
  private static readonly FIXED_TIMESTAMP = 1751990400000

  log(level: LogLevel, message: string, data?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: Logger.FIXED_TIMESTAMP,
    }
    this.logs.push(entry)
  }

  debug(message: string, data?: Record<string, any>): void {
    this.log("debug", message, data)
  }

  info(message: string, data?: Record<string, any>): void {
    this.log("info", message, data)
  }

  warn(message: string, data?: Record<string, any>): void {
    this.log("warn", message, data)
  }

  error(message: string, data?: Record<string, any>): void {
    this.log("error", message, data)
  }

  getLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit)
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level)
  }

  getLogsSince(timestamp: number): LogEntry[] {
    return this.logs.filter((log) => log.timestamp >= timestamp)
  }

  clear(): void {
    this.logs = []
  }

  getStats(): {
    totalLogs: number
    debugCount: number
    infoCount: number
    warnCount: number
    errorCount: number
  } {
    return {
      totalLogs: this.logs.length,
      debugCount: this.logs.filter((l) => l.level === "debug").length,
      infoCount: this.logs.filter((l) => l.level === "info").length,
      warnCount: this.logs.filter((l) => l.level === "warn").length,
      errorCount: this.logs.filter((l) => l.level === "error").length,
    }
  }
}
