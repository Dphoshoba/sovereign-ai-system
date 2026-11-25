/**
 * EV-OPS-01 persistent local state + evidence writers.
 * Callers: run-check.mjs. Existing: none.
 * User instruction: timestamped evidence retention; incident dedupe.
 */
import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync } from "node:fs"
import { join } from "node:path"

export function ensureDirs(rootDir) {
  for (const part of ["checks", "incidents", "notifications"]) {
    mkdirSync(join(rootDir, part), { recursive: true })
  }
}

export function loadState(rootDir) {
  const path = join(rootDir, "state.json")
  if (!existsSync(path)) {
    return {
      failureStreaks: {},
      slowStreaks: {},
      openIncidents: {},
      lastCycleAt: null,
      consecutiveOk: 0,
      lastDailySummaryDay: null,
    }
  }
  return JSON.parse(readFileSync(path, "utf8"))
}

/** Adelaide (or configured TZ) calendar day key YYYY-MM-DD for daily summary dedupe. */
export function calendarDayKey(timezone = "Australia/Adelaide", when = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(when)
}

export function saveState(rootDir, state) {
  writeFileSync(join(rootDir, "state.json"), JSON.stringify(state, null, 2))
}

export function writeCheckRecord(rootDir, cycle, classification) {
  const stamp = cycle.timestamp.replace(/[:.]/g, "-")
  const record = {
    program: "EV-OPS-01",
    timestamp: cycle.timestamp,
    baseUrl: cycle.baseUrl,
    deploymentId: cycle.deploymentId,
    buildTime: cycle.buildTime,
    overallPass: classification.overallPass,
    severity: classification.severity,
    results: cycle.results.map((r) => ({
      checkId: r.checkId,
      httpStatus: r.httpStatus,
      durationMs: r.durationMs,
      pass: r.pass,
      errorSummary: r.errorSummary,
    })),
    incidents: classification.incidents,
  }
  const file = join(rootDir, "checks", `${stamp}.json`)
  writeFileSync(file, JSON.stringify(record, null, 2))
  writeFileSync(join(rootDir, "checks", "latest.json"), JSON.stringify(record, null, 2))
  return { file, record }
}

export function incidentKey(inc) {
  return createHash("sha256").update(`${inc.severity}:${inc.code}`).digest("hex").slice(0, 16)
}

/**
 * Merge classification into open-incident state.
 * Returns { opened, resolved, stillOpen } for notification decisions.
 */
export function reconcileIncidents(state, classification, now = new Date().toISOString()) {
  const opened = []
  const resolved = []
  const stillOpen = []
  const nextOpen = { ...(state.openIncidents || {}) }
  const seen = new Set()

  for (const inc of classification.incidents) {
    const key = incidentKey(inc)
    seen.add(key)
    if (!nextOpen[key]) {
      const openedInc = {
        ...inc,
        id: key,
        startedAt: now,
        lastDetectedAt: now,
        notifyCount: 0,
      }
      nextOpen[key] = openedInc
      opened.push(openedInc)
    } else {
      nextOpen[key] = {
        ...nextOpen[key],
        lastDetectedAt: now,
        evidence: inc.evidence,
        summary: inc.summary,
      }
      stillOpen.push(nextOpen[key])
    }
  }

  for (const [key, open] of Object.entries(state.openIncidents || {})) {
    if (!seen.has(key)) {
      resolved.push({ ...open, resolvedAt: now })
      delete nextOpen[key]
    }
  }

  return { opened, resolved, stillOpen, openIncidents: nextOpen }
}

export function pruneEvidence(rootDir, retentionDays) {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
  const dir = join(rootDir, "checks")
  if (!existsSync(dir)) return 0
  let removed = 0
  for (const name of readdirSync(dir)) {
    if (name === "latest.json" || !name.endsWith(".json")) continue
    const full = join(dir, name)
    try {
      const data = JSON.parse(readFileSync(full, "utf8"))
      const ts = Date.parse(data.timestamp || "")
      if (Number.isFinite(ts) && ts < cutoff) {
        unlinkSync(full)
        removed += 1
      }
    } catch {
      // leave unreadable files for operator review
    }
  }
  return removed
}
