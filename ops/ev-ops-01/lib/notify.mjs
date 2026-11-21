/**
 * EV-OPS-01/02 notification adapters (file sink + optional Resend).
 * Callers: run-check.mjs. Live mail requires LIVE=1, emitter match, recipient, key.
 * Never logs API keys or full recipient addresses.
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import {
  resolveAlertPolicy,
  shouldEmitLiveNotification,
} from "./alert-policy.mjs"

function maskEmail(value) {
  const raw = String(value || "")
  return raw.replace(
    /([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+)/g,
    "$1***$2",
  )
}

export function createNotifier(options = {}) {
  const env = options.env || process.env
  const policy =
    options.policy ||
    resolveAlertPolicy({
      ...env,
      MONITORING_ALERTS_LIVE:
        options.live === true
          ? "1"
          : options.live === false
            ? "0"
            : env.MONITORING_ALERTS_LIVE,
      MONITORING_ALERT_TO: options.alertTo ?? env.MONITORING_ALERT_TO,
      MONITORING_ALERT_FROM:
        options.from ?? env.MONITORING_ALERT_FROM ?? env.EMAIL_FROM,
      RESEND_API_KEY: options.resendApiKey ?? env.RESEND_API_KEY,
      MONITORING_ALERT_EMITTER:
        options.emitter ?? env.MONITORING_ALERT_EMITTER,
      MONITORING_RUNNER: options.runner ?? env.MONITORING_RUNNER,
    })

  const rootDir = options.rootDir
  const forceDryRun = options.dryRun === true || options.forceDryRun === true
  const alertTo = String(options.alertTo ?? env.MONITORING_ALERT_TO ?? "").trim()
  const from =
    String(
      options.from ??
        env.MONITORING_ALERT_FROM ??
        env.EMAIL_FROM ??
        "Echoes & Visions Monitoring <onboarding@resend.dev>",
    ).trim()
  const resendApiKey = String(options.resendApiKey ?? env.RESEND_API_KEY ?? "").trim()

  mkdirSync(join(rootDir, "notifications"), { recursive: true })

  async function send({ subject, text, kind, incidentId }) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-")
    const emitLive = !forceDryRun && shouldEmitLiveNotification(policy)
    const record = {
      timestamp: new Date().toISOString(),
      kind,
      incidentId: incidentId || null,
      subject,
      text,
      dryRun: !emitLive,
      recipientConfigured: Boolean(alertTo),
      recipientMasked: alertTo ? maskEmail(alertTo) : null,
      runner: policy.runner,
      emitter: policy.emitter,
      delivery: "file",
    }

    if (emitLive && alertTo && resendApiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [alertTo],
            subject,
            text,
            tags: [
              { name: "program", value: "ev-ops-01" },
              { name: "kind", value: String(kind).slice(0, 40) },
            ],
          }),
        })
        record.delivery = res.ok ? "resend" : "resend_failed"
        record.httpStatus = res.status
        if (res.ok) {
          const body = await res.json().catch(() => ({}))
          record.providerId = body.id || null
        } else {
          record.errorSummary = (await res.text()).slice(0, 240)
        }
      } catch (error) {
        record.delivery = "resend_failed"
        record.errorSummary = String(error?.message || error).slice(0, 240)
      }
    }

    const file = join(rootDir, "notifications", `${stamp}-${kind}.json`)
    writeFileSync(file, JSON.stringify(record, null, 2))
    return record
  }

  return {
    policy,
    async notifyOpened(incident) {
      return send({
        kind: "incident_opened",
        incidentId: incident.id,
        subject: `[EV-OPS ${incident.severity.toUpperCase()}] ${incident.code}`,
        text: [
          `Incident opened: ${incident.code}`,
          `Severity: ${incident.severity}`,
          `Summary: ${incident.summary}`,
          `Started: ${incident.startedAt}`,
          `Evidence: ${JSON.stringify(incident.evidence || [], null, 2)}`,
        ].join("\n"),
      })
    },
    async notifyResolved(incident) {
      return send({
        kind: "incident_resolved",
        incidentId: incident.id,
        subject: `[EV-OPS RECOVERY] ${incident.code}`,
        text: [
          `Incident resolved: ${incident.code}`,
          `Severity: ${incident.severity}`,
          `Started: ${incident.startedAt}`,
          `Resolved: ${incident.resolvedAt}`,
        ].join("\n"),
      })
    },
    async notifyMissingData(summary) {
      return send({
        kind: "warning_missing_data",
        subject: "[EV-OPS WARNING] missing_monitoring_data",
        text: summary,
      })
    },
  }
}

export function latestNotificationExists(rootDir) {
  return existsSync(join(rootDir, "notifications"))
}

export { maskEmail }
