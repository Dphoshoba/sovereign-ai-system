#!/usr/bin/env node
/**
 * EV-OPS-02 — verify live-alert configuration without sending mail.
 * Loads local .env if present (never prints secrets or full recipients).
 */
import { readFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { resolveAlertPolicy } from "./lib/alert-policy.mjs"

function mask(value) {
  return String(value || "").replace(
    /([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+)/g,
    "$1***$2",
  )
}

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
const policy = resolveAlertPolicy(env)

const from = String(env.MONITORING_ALERT_FROM || env.EMAIL_FROM || "").trim()
const to = String(env.MONITORING_ALERT_TO || "").trim()

let resendProbe = { attempted: false }
if (env.RESEND_API_KEY) {
  resendProbe.attempted = true
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
    })
    resendProbe.httpStatus = res.status
    resendProbe.ok = res.ok
    if (res.ok) {
      const body = await res.json().catch(() => ({}))
      resendProbe.domains = (body.data || []).map((d) => ({
        name: d.name,
        status: d.status,
      }))
    } else {
      const errText = (await res.text()).slice(0, 240)
      resendProbe.errorSummary = errText
      // Send-only Resend keys cannot list domains; that is not a send blocker.
      if (/restricted_api_key|only send emails/i.test(errText)) {
        resendProbe.sendOnlyKey = true
        resendProbe.ok = true
        resendProbe.note =
          "Key is send-restricted; domains listing unavailable. Controlled send test still required after recipient confirmation."
      }
    }
  } catch (error) {
    resendProbe.ok = false
    resendProbe.errorSummary = String(error?.message || error).slice(0, 160)
  }
}

const recipientConfirmed = env.MONITORING_ALERT_TO_CONFIRMED === "1" && Boolean(to)
const blockers = [...policy.blockers]
if (!to) blockers.push("MONITORING_ALERT_TO_missing")
if (to && !recipientConfirmed) blockers.push("MONITORING_ALERT_TO_unconfirmed")
if (!from) blockers.push("EMAIL_FROM_or_MONITORING_ALERT_FROM_missing")
if (resendProbe.attempted && resendProbe.ok === false) blockers.push("resend_api_auth_failed")

const report = {
  ok: blockers.length === 0,
  liveAllowed: policy.liveAllowed && recipientConfirmed,
  policy: {
    liveRequested: policy.liveRequested,
    emitter: policy.emitter,
    runner: policy.runner,
    recipientConfigured: Boolean(to),
    recipientConfirmed,
    recipientMasked: to ? mask(to) : null,
    senderMasked: from ? mask(from) : null,
    resendKeyConfigured: policy.resendKeyConfigured,
    blockers,
  },
  resendProbe,
  githubSecretsRequired: [
    "RESEND_API_KEY",
    "MONITORING_ALERT_TO",
    "MONITORING_ALERT_FROM",
    "MONITORING_ALERTS_LIVE",
    "MONITORING_ALERT_EMITTER",
  ],
  controlledTestGate: {
    requiresDirectorRecipientConfirmation: true,
    requiresSenderEligible: true,
    requiresResendAuthOk: true,
    liveTestAuthorised: false,
  },
}

console.log(JSON.stringify(report, null, 2))
process.exit(report.ok ? 0 : 2)
