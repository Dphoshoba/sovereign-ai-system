import type { KernelWorkspace } from "./types"

export const KERNEL_ASSETS: KernelWorkspace = {
  engines: [
    {
      id: "kernel-001",
      name: "Primary Kernel",
      status: "active",
      cpuUsage: 45,
      memoryUsage: 62,
      uptimeHours: 720,
    },
    {
      id: "kernel-002",
      name: "Backup Kernel",
      status: "active",
      cpuUsage: 38,
      memoryUsage: 55,
      uptimeHours: 720,
    },
    {
      id: "kernel-003",
      name: "Processing Kernel",
      status: "active",
      cpuUsage: 72,
      memoryUsage: 78,
      uptimeHours: 168,
    },
  ],
  metrics: {
    totalEngines: 3,
    activeEngines: 3,
    cpuLoad: 51,
    memoryUsed: 65,
    requestsPerSecond: 1250,
    errorRate: 0.02,
    avgResponseTime: 45,
  },
  uptime: 720,
  version: "6.0.0",
}
