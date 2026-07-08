# Gamma Phase XII - Quick Reference Guide

## 🚀 Getting Started

### Import Pattern
```typescript
// Kernel components
import { Kernel } from "@/kernel/kernel"
import { Scheduler } from "@/kernel/scheduler"
import { WorkflowEngine } from "@/kernel/workflow-engine"
import { CacheManager } from "@/kernel/cache-manager"
import { Logger } from "@/kernel/logger"
import { PermissionManager } from "@/kernel/permission-manager"
import { PluginLoader } from "@/kernel/plugin-loader"
import { MetricsCollector } from "@/kernel/metrics-collector"
import { DependencyResolver } from "@/kernel/dependency-resolver"

// Reader functions
import { getKernelRegistry } from "@/lib/gamma/kernel-reader"
import { getEnterpriseMonitorRegistry } from "@/lib/gamma/enterprise-monitor-reader"
```

---

## 🔧 Kernel Components Usage

### Scheduler
```typescript
import { Scheduler } from "@/kernel/scheduler"

const scheduler = new Scheduler()
scheduler.recordSchedule({
  engineId: "engine-1",
  frequency: "daily",
  lastRun: 1751990400000,
  nextRun: 1751990400000 + 86400000,
})

const nextRun = scheduler.getNextRun("engine-1")
```

### WorkflowEngine
```typescript
import { WorkflowEngine } from "@/kernel/workflow-engine"

const engine = new WorkflowEngine()
engine.defineWorkflow({
  id: "workflow-1",
  name: "Processing Pipeline",
  steps: [
    { engineId: "step1", action: "initialize", timeout: 5000, retryCount: 3 },
    { engineId: "step2", action: "process", timeout: 10000, retryCount: 3 },
  ],
  parallelizable: false,
})

const execution = await engine.executeWorkflow("workflow-1", { data: "input" })
```

### CacheManager
```typescript
import { CacheManager } from "@/kernel/cache-manager"

const cache = new CacheManager()
cache.set("key1", { value: "data" }, 3600000) // 1 hour TTL
const data = cache.get("key1") // null if expired
```

### Logger
```typescript
import { Logger } from "@/kernel/logger"

const logger = new Logger()
logger.info("System started", { version: "1.0" })
logger.error("Failed operation", { code: "ERR_001" })
const logs = logger.getLogs(100)
```

### PermissionManager
```typescript
import { PermissionManager } from "@/kernel/permission-manager"

const perms = new PermissionManager()
const canWrite = perms.can("ceo", "write") // true
const canDelete = perms.can("viewer", "delete") // false
```

### PluginLoader
```typescript
import { PluginLoader } from "@/kernel/plugin-loader"

const loader = new PluginLoader()
await loader.loadPlugin({
  id: "plugin-1",
  name: "Analytics Plugin",
  version: "1.0.0",
  enabled: true,
  config: { /* ... */ },
})
```

### MetricsCollector
```typescript
import { MetricsCollector } from "@/kernel/metrics-collector"

const collector = new MetricsCollector()
collector.recordMetric("engine-1", {
  name: "responseTime",
  value: 250,
  unit: "ms",
})
const metrics = collector.getMetrics("engine-1")
```

### DependencyResolver
```typescript
import { DependencyResolver } from "@/kernel/dependency-resolver"

const resolver = new DependencyResolver()
resolver.registerDependency("service-a", ["service-b", "service-c"])
const cycles = resolver.detectCycles() // []
const order = resolver.topologicalSort() // ["service-b", "service-c", "service-a"]
```

---

## 📊 Reader Components (Build 101-110)

### Accessing Build Data
```typescript
// Build 101: Kernel
const kernelData = await getKernelRegistry()
// Returns: {kernelScore: 88, engineCount: 34, ...}

// Build 102: Registry
const registryData = await getRegistryRegistry()
// Returns: {registryScore: 85, totalEngines: 34, ...}

// Build 110: Enterprise Monitor (Aggregator)
const monitorData = await getEnterpriseMonitorRegistry()
// Returns: {monitorScore: 91, subsystemScores: {...}, ...}
```

### All Available Readers
1. `getKernelRegistry()` - Build 101
2. `getRegistryRegistry()` - Build 102
3. `getEventBusRegistry()` - Build 103
4. `getWorkflowEngineRegistry()` - Build 104
5. `getSchedulerRegistry()` - Build 105
6. `getPluginSystemRegistry()` - Build 106
7. `getApiGatewayRegistry()` - Build 107
8. `getPermissionsRegistry()` - Build 108
9. `getSdkGeneratorRegistry()` - Build 109
10. `getEnterpriseMonitorRegistry()` - Build 110

---

## 🌐 Web Endpoints

### List Pages
- http://localhost:3000/kernel
- http://localhost:3000/registry
- http://localhost:3000/event-bus
- http://localhost:3000/workflow-engine
- http://localhost:3000/scheduler
- http://localhost:3000/plugin-system
- http://localhost:3000/api-gateway
- http://localhost:3000/permissions
- http://localhost:3000/sdk-generator
- http://localhost:3000/enterprise-monitor

### Detail Pages
- http://localhost:3000/kernel/{id}
- http://localhost:3000/registry/{id}
- etc. (same pattern for all builds)

### API Endpoints
- `GET /api/gamma` - API Gateway status
- `POST /api/gamma` - Submit API request
- `GET /api/gamma/sdk` - SDK generation status
- `POST /api/gamma/sdk` - Initiate SDK generation

---

## 📋 File Locations

### Source Files
- Kernel: `src/kernel/*.ts`
- Readers: `src/lib/gamma/*-reader.ts`
- Pages: `app/{build-name}/page.tsx`
- Details: `app/{build-name}/[id]/page.tsx`
- API: `app/api/gamma/route.ts`, `app/api/gamma/sdk/route.ts`

### Documentation
- Reports: `PHASE_XII_BUILD_REPORT.md`
- Inventory: `PHASE_XII_FILE_INVENTORY.md`
- This Guide: `PHASE_XII_QUICK_REFERENCE.md`

---

## 🔐 Metrics Reference

All metrics are deterministic with fixed values:

| Component | Score | Target Metric |
|-----------|-------|---------------|
| Kernel | 88 | 34 engines healthy |
| Registry | 85 | 34 total registered |
| Event Bus | 82 | 350 events processed |
| Workflow | 84 | 5 active workflows |
| Scheduler | 83 | 100% precision |
| Plugins | 80 | 8 active plugins |
| API Gateway | 86 | 150 endpoints |
| Permissions | 87 | 8 roles configured |
| SDK Generator | 81 | 3 languages |
| Enterprise Monitor | 91 | 100% system health |

---

## ✅ Verification Checklist

Before deploying Phase XII:

- [ ] All kernel components importable
- [ ] All readers return mock data
- [ ] All pages render without errors
- [ ] API endpoints respond
- [ ] Fixed timestamp consistent (1751990400000)
- [ ] No randomization in data
- [ ] All metrics clamp to 0-100
- [ ] TypeScript compilation passes
- [ ] No broken imports

---

## 🚀 Deployment

### Development
```bash
npm run dev
# Access http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

### Testing APIs
```bash
curl http://localhost:3000/api/gamma
curl -X POST http://localhost:3000/api/gamma/sdk \
  -H "Content-Type: application/json" \
  -d '{"language":"typescript","version":"1.0.0"}'
```

---

## 📞 Support References

- Kernel: Enterprise runtime and orchestration
- Readers: Data access layer (deterministic mock)
- Pages: Server-side rendered components
- API: RESTful endpoints for integrations

**Phase XII Status: ✅ COMPLETE**
