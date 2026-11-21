#!/usr/bin/env node
/**
 * EV-OPS-02 controlled test notification (one labelled email).
 * Does not mutate Production or open synthetic Production incidents.
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

const fileEnv = loadDotEnv(join(repoRoot, ".env"))
const env = { ...fileEnv, ...process.env }
const to = "davidoshoba@gmail.com"
const from = String(env.MONITORING_ALERT_FROM || env.EMAIL_FROM || "").trim()
const key = String(env.RESEND_API_KEY || "").trim()

if (!from) {
  console.log(JSON.stringify({ ok: false, error: "sender_missing" }))
  process.exit(1)
}
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

// Exactly one live email (Director-authorised controlled test).
const opened = await notifier.notifyOpened({
  id: "controlled-test",
  code: "ev_ops_02_controlled_test",
  severity: "warning",
  summary:
    "CONTROLLED TEST ONLY — EV-OPS-02 monitoring notification verification. Not a Production incident.",
  startedAt: new Date().toISOString(),
  evidence: [{ checkId: "controlled_test", pass: true, note: "director_authorised" }],
})

// Recovery + duplicate formatting checked in dry-run (no additional live mail).
const dry = createNotifier({
  rootDir,
  live: false,
  emitter: "cloud",
  runner: "cloud",
  alertTo: to,
  from,
  resendApiKey: key,
  forceDryRun: true,
})
const recoveryDry = await dry.notifyResolved({
  id: "controlled-test",
  code: "ev_ops_02_controlled_test",
  severity: "warning",
  startedAt: opened.timestamp,
  resolvedAt: new Date().toISOString(),
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

const report = {
  ok: opened.delivery === "resend" && !opened.dryRun && hostAttempt.dryRun === true,
  recipientMasked: "d***@gmail.com",
  senderConfigured: true,
  liveTest: {
    delivery: opened.delivery,
    httpStatus: opened.httpStatus || null,
    providerId: opened.providerId || null,
    dryRun: opened.dryRun,
    subject: opened.subject,
    errorSummary: opened.errorSummary || null,
  },
  recoveryFormatDryRun: {
    delivery: recoveryDry.delivery,
    dryRun: recoveryDry.dryRun,
    subject: recoveryDry.subject,
  },
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
