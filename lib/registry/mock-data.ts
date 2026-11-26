import type { RegistryWorkspace } from "./types"

export const REGISTRY_ASSETS: RegistryWorkspace = {
  entries: [
    {
      id: "svc-001",
      name: "Authentication Service",
      type: "service",
      version: "3.2.1",
      status: "active",
      dependencies: ["kernel-001", "cache-001"],
    },
    {
      id: "svc-002",
      name: "Data Service",
      type: "service",
      version: "2.8.0",
      status: "active",
      dependencies: ["kernel-001"],
    },
    {
      id: "svc-003",
      name: "Analytics Service",
      type: "service",
      version: "1.5.2",
      status: "active",
      dependencies: ["data-service", "kernel-002"],
    },
  ],
  metrics: {
    totalEntries: 3,
    activeServices: 3,
    registrationRate: 95,
    failureRate: 1,
  },
  lastSync: 1751990400000,
}
