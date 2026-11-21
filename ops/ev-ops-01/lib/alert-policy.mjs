/**
 * EV-OPS-02 alert emission policy (single live emitter across runners).
 * Callers: notify.mjs, verify-notify-config.mjs, run-check.mjs.
 * Prevents Windows host + GitHub Actions from both sending live mail.
 */

export const ALERT_EMITTERS = Object.freeze(["none", "host", "cloud"])

/**
 * Resolve whether this process may send live notifications.
 * Live still requires MONITORING_ALERTS_LIVE=1, recipient, and API key.
 */
export function resolveAlertPolicy(env = process.env) {
  const liveRequested = env.MONITORING_ALERTS_LIVE === "1"
  const emitterRaw = String(env.MONITORING_ALERT_EMITTER || "none").toLowerCase()
  const emitter = ALERT_EMITTERS.includes(emitterRaw) ? emitterRaw : "none"
  const runner = String(env.MONITORING_RUNNER || detectRunner(env)).toLowerCase()
  const alertTo = String(env.MONITORING_ALERT_TO || "").trim()
  const from =
    String(env.MONITORING_ALERT_FROM || env.EMAIL_FROM || "").trim() ||
    "Echoes & Visions Monitoring <onboarding@resend.dev>"
  const hasKey = Boolean(String(env.RESEND_API_KEY || "").trim())

  const emitterMatches =
    emitter !== "none" &&
    ((emitter === "cloud" && runner === "cloud") ||
      (emitter === "host" && runner === "host"))

  const liveAllowed = liveRequested && emitterMatches && Boolean(alertTo) && hasKey

  const blockers = []
  if (liveRequested && !alertTo) blockers.push("MONITORING_ALERT_TO_missing")
  if (liveRequested && !hasKey) blockers.push("RESEND_API_KEY_missing")
  if (liveRequested && emitter === "none") blockers.push("MONITORING_ALERT_EMITTER_none")
  if (liveRequested && emitter !== "none" && !emitterMatches) {
    blockers.push(`emitter_runner_mismatch:${emitter}_vs_${runner}`)
  }
  if (!from) blockers.push("sender_from_missing")

  return {
    liveRequested,
    liveAllowed,
    dryRun: !liveAllowed,
    emitter,
    runner,
    recipientConfigured: Boolean(alertTo),
    senderConfigured: Boolean(from),
    resendKeyConfigured: hasKey,
    blockers,
  }
}

export function detectRunner(env = process.env) {
  if (env.GITHUB_ACTIONS === "true" || env.MONITORING_RUNNER === "cloud") return "cloud"
  if (env.MONITORING_RUNNER === "host") return "host"
  return "host"
}

/**
 * Cross-runner dedupe: only the designated emitter opens live notifications.
 * Secondary runners keep local incident state + file-sink receipts.
 */
export function shouldEmitLiveNotification(policy, options = {}) {
  if (options.forceDryRun) return false
  return Boolean(policy?.liveAllowed)
}
