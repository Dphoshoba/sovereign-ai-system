#!/usr/bin/env node
/**
 * EV-OPS-01 Production monitoring cycle entrypoint.
 * Callers: Windows Scheduled Task (legacy/disabled), GitHub Actions, local verification.
 * Existing public health endpoints only; no Production mutate.
 * User instruction: hourly Production monitoring with evidence + alerts.
 */
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { loadConfig } from "./lib/config.mjs"
import { runChecks } from "./lib/checks.mjs"
import { classifyCycle } from "./lib/classify.mjs"
import {
  ensureDirs,
  loadState,
  saveState,
  writeCheckRecord,
  reconcileIncidents,
  pruneEvidence,
  calendarDayKey,
} from "./lib/state.mjs"
import { createNotifier } from "./lib/notify.mjs"
import { detectRunner, resolveAlertPolicy } from "./lib/alert-policy.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = process.env.EV_OPS_01_VAR_DIR || join(__dirname, "var")

export async function runMonitoringCycle(options = {}) {
  const config = loadConfig(options.config)
  ensureDirs(rootDir)
  const state = loadState(rootDir)
  const cycle = options.cycle || (await runChecks(config))
  const classification = classifyCycle(cycle, config, state)
  const { file, record } = writeCheckRecord(rootDir, cycle, classification)
  const reconciled = reconcileIncidents(state, classification)
  const policy = resolveAlertPolicy(process.env)
  const notifier = createNotifier({
    rootDir,
    policy,
    // Host stays evidence/dry-run unless explicitly designated emitter + LIVE.
    forceDryRun:
      options.dryRun === true ||
      (options.dryRun !== false && !policy.liveAllowed),
    runner: detectRunner(process.env),
  })

  const notifications = []
  for (const opened of reconciled.opened) {
    // Dedupe: never re-notify an incident that already has a live/file open receipt.
    if ((opened.notifyCount || 0) >= 1) continue
    if (opened.severity === "critical" || opened.severity === "warning") {
      const n = await notifier.notifyOpened(opened)
      notifications.push(n)
      opened.notifyCount = (opened.notifyCount || 0) + 1
      reconciled.openIncidents[opened.id] = opened
    }
  }
  for (const resolved of reconciled.resolved) {
    // Recovery notification once per cleared incident.
    if (resolved.recoveryNotified) continue
    const n = await notifier.notifyResolved(resolved)
    notifications.push(n)
    resolved.recoveryNotified = true
  }

  // Once per Adelaide calendar day when prior state exists (cloud cache / host disk).
  // Requires lastCycleAt so a cold runner without restored state cannot spam hourly.
  const dayKey = calendarDayKey(config.dailySummaryTimezone || "Australia/Adelaide")
  let lastDailySummaryDay = state.lastDailySummaryDay || null
  if (
    state.lastCycleAt &&
    lastDailySummaryDay !== dayKey
  ) {
    const summary = await notifier.notifyDailySummary({
      timezone: config.dailySummaryTimezone || "Australia/Adelaide",
      dayKey,
      ok: classification.overallPass,
      severity: classification.severity,
      deploymentId: cycle.deploymentId,
      openIncidentCodes: Object.values(reconciled.openIncidents).map((i) => i.code),
      consecutiveOk: classification.overallPass
        ? (state.consecutiveOk || 0) + 1
        : 0,
      timestamp: cycle.timestamp,
    })
    notifications.push(summary)
    lastDailySummaryDay = dayKey
  }

  const removed = pruneEvidence(rootDir, config.retentionDays)
  const nextState = {
    failureStreaks: classification.failureStreaks,
    slowStreaks: classification.slowStreaks,
    openIncidents: reconciled.openIncidents,
    lastCycleAt: cycle.timestamp,
    consecutiveOk: classification.overallPass
      ? (state.consecutiveOk || 0) + 1
      : 0,
    lastDeploymentId: cycle.deploymentId,
    lastDailySummaryDay,
  }
  saveState(rootDir, nextState)

  return {
    ok: classification.overallPass,
    severity: classification.severity,
    recordPath: file,
    record,
    notifications,
    opened: reconciled.opened,
    resolved: reconciled.resolved,
    pruned: removed,
    state: nextState,
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  runMonitoringCycle({})
    .then((result) => {
      console.log(
        JSON.stringify(
          {
            ok: result.ok,
            severity: result.severity,
            timestamp: result.record.timestamp,
            deploymentId: result.record.deploymentId,
            buildTime: result.record.buildTime,
            checks: result.record.results,
            opened: result.opened.map((i) => i.code),
            resolved: result.resolved.map((i) => i.code),
            notifications: result.notifications.map((n) => ({
              kind: n.kind,
              delivery: n.delivery,
              dryRun: n.dryRun,
              runner: n.runner,
              emitter: n.emitter,
            })),
            recordPath: result.recordPath,
          },
          null,
          2,
        ),
      )
      process.exit(result.ok ? 0 : 2)
    })
    .catch((error) => {
      console.error(JSON.stringify({ ok: false, error: String(error?.message || error) }))
      process.exit(1)
    })
}
