#!/usr/bin/env node
/**
 * EV-OPS-01 safe alert simulations (no live Production impact, dry-run notify).
 * Callers: verification / CI. Existing classify+notify modules.
 * User instruction: prove alert, recovery, and duplicate suppression safely.
 */
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { loadConfig } from "./lib/config.mjs"
import { classifyCycle } from "./lib/classify.mjs"
import {
  ensureDirs,
  loadState,
  saveState,
  writeCheckRecord,
  reconcileIncidents,
  incidentKey,
} from "./lib/state.mjs"
import { createNotifier } from "./lib/notify.mjs"

function failingCycle(overrides = {}) {
  const timestamp = new Date().toISOString()
  return {
    timestamp,
    baseUrl: "https://www.echoesandvisions.com",
    deploymentId: "dpl_UNEXPECTED",
    buildTime: "1999-01-01T00:00:00.000Z",
    results: [
      {
        checkId: "homepage",
        httpStatus: 503,
        durationMs: 120,
        pass: false,
        errorSummary: "unexpected_status_503",
      },
      {
        checkId: "health",
        httpStatus: 503,
        durationMs: 100,
        pass: false,
        errorSummary: "unexpected_status_503",
        json: { ok: false, database: "disconnected" },
      },
      {
        checkId: "healthDb",
        httpStatus: 500,
        durationMs: 90,
        pass: false,
        errorSummary: "unexpected_status_500",
        json: { ok: false },
      },
      {
        checkId: "deploymentIdentity",
        httpStatus: 200,
        durationMs: 0,
        pass: false,
        errorSummary: "unexpected_production_deployment_or_build_time",
        json: {
          expectedDeploymentId: "dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo",
          observedDeploymentId: "dpl_UNEXPECTED",
        },
      },
      {
        checkId: "healthSemantics",
        httpStatus: 503,
        durationMs: 0,
        pass: false,
        errorSummary: "health_or_database_not_ok",
      },
      ...(overrides.extraResults || []),
    ],
  }
}

function healthyCycle() {
  const timestamp = new Date().toISOString()
  return {
    timestamp,
    baseUrl: "https://www.echoesandvisions.com",
    deploymentId: "dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo",
    buildTime: "2026-11-18T09:45:18.361Z",
    results: [
      { checkId: "homepage", httpStatus: 200, durationMs: 200, pass: true, errorSummary: null },
      {
        checkId: "health",
        httpStatus: 200,
        durationMs: 180,
        pass: true,
        errorSummary: null,
        json: { ok: true, database: "connected", buildTime: "2026-11-18T09:45:18.361Z" },
      },
      {
        checkId: "healthDb",
        httpStatus: 200,
        durationMs: 150,
        pass: true,
        errorSummary: null,
        json: { ok: true, database: "connected" },
      },
      { checkId: "deploymentIdentity", httpStatus: 200, durationMs: 0, pass: true, errorSummary: null },
      { checkId: "healthSemantics", httpStatus: 200, durationMs: 0, pass: true, errorSummary: null },
    ],
  }
}

async function runSim() {
  const rootDir = mkdtempSync(join(tmpdir(), "ev-ops-01-sim-"))
  ensureDirs(rootDir)
  const config = loadConfig({ criticalFailureThreshold: 2, slowResponseThreshold: 3 })
  const notifier = createNotifier({ rootDir, dryRun: true, live: false })

  let state = loadState(rootDir)
  const notifications = []

  // First failure — below threshold, no critical open yet for homepage streak=1
  let cycle = failingCycle()
  let classification = classifyCycle(cycle, config, state)
  writeCheckRecord(rootDir, cycle, classification)
  let reconciled = reconcileIncidents(state, classification)
  state = {
    ...state,
    failureStreaks: classification.failureStreaks,
    slowStreaks: classification.slowStreaks,
    openIncidents: reconciled.openIncidents,
  }
  saveState(rootDir, state)

  // Second consecutive failure — opens critical incidents
  cycle = failingCycle()
  classification = classifyCycle(cycle, config, state)
  writeCheckRecord(rootDir, cycle, classification)
  reconciled = reconcileIncidents(state, classification)
  for (const opened of reconciled.opened) {
    notifications.push(await notifier.notifyOpened(opened))
    opened.notifyCount = 1
    reconciled.openIncidents[opened.id] = opened
  }
  const openedCodes = reconciled.opened.map((i) => i.code)
  state = {
    ...state,
    failureStreaks: classification.failureStreaks,
    openIncidents: reconciled.openIncidents,
  }
  saveState(rootDir, state)

  // Third failure — same incidents still open; duplicate suppression (no new notify)
  cycle = failingCycle()
  classification = classifyCycle(cycle, config, state)
  writeCheckRecord(rootDir, cycle, classification)
  reconciled = reconcileIncidents(state, classification)
  const duplicateOpened = reconciled.opened.length
  for (const still of reconciled.stillOpen) {
    // already notified — do not notify again
    if ((still.notifyCount || 0) >= 1) continue
    notifications.push(await notifier.notifyOpened(still))
  }
  state = {
    ...state,
    failureStreaks: classification.failureStreaks,
    openIncidents: reconciled.openIncidents,
  }
  saveState(rootDir, state)

  // Recovery — healthy cycle resolves incidents
  cycle = healthyCycle()
  classification = classifyCycle(cycle, config, state)
  writeCheckRecord(rootDir, cycle, classification)
  reconciled = reconcileIncidents(state, classification)
  const recoveryNotifications = []
  for (const resolved of reconciled.resolved) {
    recoveryNotifications.push(await notifier.notifyResolved(resolved))
  }

  const report = {
    ok: true,
    simulationRoot: rootDir,
    openedOnThreshold: openedCodes,
    duplicateOpenedOnThirdFailure: duplicateOpened,
    recoveryCount: recoveryNotifications.length,
    notifications: [...notifications, ...recoveryNotifications].map((n) => ({
      kind: n.kind,
      delivery: n.delivery,
      dryRun: n.dryRun,
    })),
    assertions: {
      openedCritical: openedCodes.includes("production_unavailable"),
      openedDeployDrift: openedCodes.includes("unexpected_production_deployment"),
      duplicatesSuppressed: duplicateOpened === 0,
      recoveryNotified: recoveryNotifications.length > 0,
      allDryRun: [...notifications, ...recoveryNotifications].every((n) => n.dryRun),
    },
  }

  // Cleanup temp sim dir unless KEEP_SIM=1
  if (process.env.KEEP_SIM !== "1") {
    rmSync(rootDir, { recursive: true, force: true })
    report.simulationRoot = "(deleted)"
  }

  const pass = Object.values(report.assertions).every(Boolean)
  report.pass = pass
  console.log(JSON.stringify(report, null, 2))
  process.exit(pass ? 0 : 1)
}

runSim().catch((error) => {
  console.error(error)
  process.exit(1)
})
