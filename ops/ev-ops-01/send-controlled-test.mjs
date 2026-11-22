#!/usr/bin/env node
/**
 * EV-OPS-02 controlled test notification (one labelled email).
 * Uses verified sender monitor@alerts.davidictoptech.com.
 * Does not mutate Production.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createNotifier } from "./lib/notify.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, "..", "..")

function loadDotEnv(path) {
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue
    const i = line.indexOf("=")
    if (i < 1) continue
    const k = line.slice(0, i).trim()
    let v = line.slice(i + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    out[k] = v
  }
  return out
}

function mask(value) {
  return String(value || "").replace(
    /([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+)/g,
    "$1***$2",
  )
}

const fileEnv = loadDotEnv(join(repoRoot, ".env"))
const env = { ...fileEnv, ...process.env }
const to = String(process.env.MONITORING_ALERT_TO || "davidoshoba@gmail.com").trim()
const from =
  String(
    process.env.MONITORING_ALERT_FROM ||
      "Echoes & Visions Monitoring <monitor@alerts.davidictoptech.com>",
  ).trim()
const key = String(env.RESEND_API_KEY || "").trim()

if (!key) {
  console.log(JSON.stringify({ ok: false, error: "resend_key_missing" }))
  process.exit(1)
}

const rootDir = join(__dirname, "var")
mkdirSync(join(rootDir, "notifications"), { recursive: true })

const notifier = createNotifier({
  rootDir,
  live: true,
  emitter: "host",
  runner: "host",
  alertTo: to,
  from,
  resendApiKey: key,
  forceDryRun: false,
})

const opened = await notifier.notifyOpened({
  id: "controlled-test",
  code: "ev_ops_02_controlled_test",
  severity: "warning",
  summary:
    "CONTROLLED TEST ONLY — EV-OPS-02 monitoring notification verification. Not a Production incident. Sender: monitor@alerts.davidictoptech.com",
  startedAt: new Date().toISOString(),
  evidence: [{ checkId: "controlled_test", pass: true, note: "director_authorised" }],
})

const hostSuppressed = createNotifier({
  rootDir,
  live: true,
  emitter: "cloud",
  runner: "host",
  alertTo: to,
  from,
  resendApiKey: key,
})
const hostAttempt = await hostSuppressed.notifyOpened({
  id: "dup-suppress",
  code: "ev_ops_02_controlled_test",
  severity: "warning",
  summary: "Should remain dry-run on host when emitter=cloud",
  startedAt: new Date().toISOString(),
  evidence: [],
})

let deliveryLookup = null
if (opened.providerId && key) {
  try {
    const res = await fetch(`https://api.resend.com/emails/${opened.providerId}`, {
      headers: { Authorization: `Bearer ${key}` },
    })
    const body = await res.json().catch(() => ({}))
    deliveryLookup = {
      httpStatus: res.status,
      id: body.id || opened.providerId,
      lastEvent: body.last_event || null,
      createdAt: body.created_at || null,
      fromMasked: body.from ? mask(body.from) : null,
      toMasked: Array.isArray(body.to) ? body.to.map(mask) : null,
    }
  } catch (error) {
    deliveryLookup = {
      httpStatus: null,
      errorSummary: String(error?.message || error).slice(0, 160),
    }
  }
}

const report = {
  ok: opened.delivery === "resend" && !opened.dryRun && hostAttempt.dryRun === true,
  recipientMasked: mask(to),
  senderMasked: mask(from),
  liveTest: {
    delivery: opened.delivery,
    httpStatus: opened.httpStatus || null,
    providerId: opened.providerId || null,
    dryRun: opened.dryRun,
    subject: opened.subject,
    errorSummary: opened.errorSummary || null,
  },
  deliveryLookup,
  crossRunnerHostSuppressed: {
    delivery: hostAttempt.delivery,
    dryRun: hostAttempt.dryRun,
    runner: hostAttempt.runner,
    emitter: hostAttempt.emitter,
  },
}

writeFileSync(
  join(rootDir, "controlled-test-result.json"),
  JSON.stringify(report, null, 2),
)
console.log(JSON.stringify(report, null, 2))
process.exit(report.ok ? 0 : 1)
