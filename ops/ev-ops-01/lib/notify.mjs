/**
 * EV-OPS-01 notification adapters (file sink + optional Resend).
 * Callers: run-check.mjs. Existing Resend used by newsletter routes; this module
 * never sends live mail unless MONITORING_ALERTS_LIVE=1 and recipient is set.
 * User instruction: alerts with dedupe + recovery; no unconfirmed test blasts.
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"

export function createNotifier(options = {}) {
  const {
    rootDir,
    dryRun = true,
    alertTo = process.env.MONITORING_ALERT_TO || "",
    from =
      process.env.MONITORING_ALERT_FROM ||
      process.env.EMAIL_FROM ||
      "Echoes & Visions Monitoring <onboarding@resend.dev>",
    resendApiKey = process.env.RESEND_API_KEY || "",
    live = process.env.MONITORING_ALERTS_LIVE === "1",
  } = options

  mkdirSync(join(rootDir, "notifications"), { recursive: true })

  async function send({ subject, text, kind, incidentId }) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-")
    const record = {
      timestamp: new Date().toISOString(),
      kind,
      incidentId: incidentId || null,
      subject,
      text,
      dryRun: dryRun || !live || !alertTo,
      recipientConfigured: Boolean(alertTo),
      delivery: "file",
    }

    if (!dryRun && live && alertTo && resendApiKey) {
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
          }),
        })
        record.delivery = res.ok ? "resend" : "resend_failed"
        record.httpStatus = res.status
        if (!res.ok) {
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
    async notifyOpened(incident) {
      return send({
        kind: "incident_opened",
        incidentId: incident.id,
        subject: `[EV-OPS-01 ${incident.severity.toUpperCase()}] ${incident.code}`,
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
        subject: `[EV-OPS-01 RECOVERY] ${incident.code}`,
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
        subject: "[EV-OPS-01 WARNING] missing_monitoring_data",
        text: summary,
      })
    },
  }
}

export function latestNotificationExists(rootDir) {
  return existsSync(join(rootDir, "notifications"))
}
