/**
 * EV-OPS-01 incident classification and consecutive-failure thresholds.
 * Callers: run-check.mjs. Existing: none for ops monitoring.
 * User instruction: Critical/Warning thresholds with consecutive failures.
 */

export function classifyCycle(cycle, config, priorState = {}) {
  const failures = cycle.results.filter((r) => !r.pass)
  const slow = cycle.results.filter(
    (r) => r.durationMs != null && r.durationMs >= config.slowResponseMs,
  )

  const byId = Object.fromEntries(cycle.results.map((r) => [r.checkId, r]))
  const streak = { ...(priorState.failureStreaks || {}) }
  const slowStreak = { ...(priorState.slowStreaks || {}) }

  for (const r of cycle.results) {
    streak[r.checkId] = r.pass ? 0 : (streak[r.checkId] || 0) + 1
    const isSlow = r.durationMs != null && r.durationMs >= config.slowResponseMs
    slowStreak[r.checkId] = isSlow ? (slowStreak[r.checkId] || 0) + 1 : 0
  }

  const incidents = []

  const unavailable =
    byId.homepage && !byId.homepage.pass && streak.homepage >= config.criticalFailureThreshold
  if (unavailable) {
    incidents.push(incident("critical", "production_unavailable", "Production homepage unavailable", [
      byId.homepage,
    ]))
  }

  const dbFail =
    (byId.healthSemantics && !byId.healthSemantics.pass && streak.healthSemantics >= config.criticalFailureThreshold) ||
    (byId.healthDb && !byId.healthDb.pass && streak.healthDb >= config.criticalFailureThreshold)
  if (dbFail) {
    incidents.push(incident("critical", "database_connectivity_failure", "Database health check failed", [
      byId.healthDb,
      byId.healthSemantics,
    ].filter(Boolean)))
  }

  if (
    byId.deploymentIdentity &&
    !byId.deploymentIdentity.pass &&
    streak.deploymentIdentity >= config.criticalFailureThreshold
  ) {
    incidents.push(incident("critical", "unexpected_production_deployment", "Unexpected Production deployment identity", [
      byId.deploymentIdentity,
    ]))
  }

  for (const authId of ["directorAuth", "cronPipelineAuth", "cronPublishAuth", "socialTwitterAuth"]) {
    const r = byId[authId]
    if (r && !r.pass && streak[authId] >= config.criticalFailureThreshold) {
      incidents.push(
        incident(
          "critical",
          "security_auth_gate_anomaly",
          `Auth gate anomaly on ${authId}`,
          [r],
        ),
      )
    }
  }

  const fiveXxCritical = cycle.results.filter(
    (r) =>
      r.httpStatus != null &&
      r.httpStatus >= 500 &&
      (streak[r.checkId] || 0) >= config.criticalFailureThreshold,
  )
  if (fiveXxCritical.length > 0) {
    incidents.push(
      incident("critical", "http_5xx_burst", "HTTP 5xx failures detected", fiveXxCritical),
    )
  }

  const slowElevated = Object.entries(slowStreak).filter(
    ([, n]) => n >= config.slowResponseThreshold,
  )
  if (slowElevated.length > 0) {
    incidents.push(
      incident(
        "warning",
        "elevated_latency",
        "Repeated slow responses",
        slowElevated.map(([id]) => byId[id]).filter(Boolean),
      ),
    )
  }

  if (failures.some((f) => f.checkId.startsWith("cron")) && !incidents.some((i) => i.code === "security_auth_gate_anomaly")) {
    const cronFails = failures.filter((f) => f.checkId.startsWith("cron"))
    if (cronFails.every((f) => (streak[f.checkId] || 0) >= config.criticalFailureThreshold)) {
      // already covered as auth anomaly when expect 401 fails
    }
  }

  const overallPass = incidents.filter((i) => i.severity === "critical").length === 0 && failures.length === 0

  return {
    overallPass,
    severity: incidents.some((i) => i.severity === "critical")
      ? "critical"
      : incidents.length
        ? "warning"
        : "ok",
    incidents,
    failureStreaks: streak,
    slowStreaks: slowStreak,
    failureCount: failures.length,
    slowCount: slow.length,
  }
}

function incident(severity, code, summary, evidence) {
  return {
    severity,
    code,
    summary,
    detectedAt: new Date().toISOString(),
    evidence: evidence.map((e) => ({
      checkId: e.checkId,
      httpStatus: e.httpStatus,
      durationMs: e.durationMs,
      errorSummary: e.errorSummary,
    })),
  }
}
