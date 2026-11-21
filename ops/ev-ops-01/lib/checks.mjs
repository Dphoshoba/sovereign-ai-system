/**
 * EV-OPS-01 read-only Production probes.
 * Callers: runCycle in run-check.mjs / classify.mjs.
 * Existing public /api/health and /api/health/db; never bypasses auth.
 * User instruction: HTTPS, health, DB, deploy identity, 5xx, auth anomalies.
 */

function nowIso() {
  return new Date().toISOString()
}

async function probe(baseUrl, name, spec, userAgent) {
  const url = new URL(spec.path, baseUrl).toString()
  const started = Date.now()
  const method = spec.method || "GET"
  // Follow redirects for availability GETs; keep auth probes manual so we
  // observe the raw gate status (401) instead of a login bounce.
  const redirect =
    spec.redirect ||
    (method === "GET" || method === "HEAD" ? "follow" : "manual")
  const init = {
    method,
    redirect,
    headers: {
      "user-agent": userAgent,
      ...(spec.headers || {}),
    },
  }
  if (spec.body != null && init.method !== "GET" && init.method !== "HEAD") {
    init.body = spec.body
  }

  try {
    const res = await fetch(url, init)
    const durationMs = Date.now() - started
    const text = await res.text()
    let json = null
    try {
      json = JSON.parse(text)
    } catch {
      json = null
    }
    const expect = spec.expectStatus || [200]
    const statusOk = expect.includes(res.status)
    return {
      checkId: name,
      url,
      method: init.method,
      timestamp: nowIso(),
      httpStatus: res.status,
      durationMs,
      pass: statusOk,
      expectStatus: expect,
      bodySnippet: text.slice(0, 400),
      // Keep a larger scan buffer in-memory only for deployment id extraction.
      _scanBody: name === "homepage" ? text.slice(0, 200000) : null,
      json,
      errorSummary: statusOk ? null : `unexpected_status_${res.status}`,
    }
  } catch (error) {
    return {
      checkId: name,
      url,
      method: spec.method || "GET",
      timestamp: nowIso(),
      httpStatus: null,
      durationMs: Date.now() - started,
      pass: false,
      expectStatus: spec.expectStatus || [200],
      bodySnippet: null,
      json: null,
      errorSummary: String(error?.message || error).slice(0, 240),
    }
  }
}

function extractDeploymentId(homepageBody) {
  if (!homepageBody) return null
  const match = String(homepageBody).match(/dpl_[A-Za-z0-9]+/)
  return match ? match[0] : null
}

/**
 * Run the configured Production check suite once.
 */
export async function runChecks(config) {
  const results = []
  for (const [name, spec] of Object.entries(config.checks)) {
    results.push(await probe(config.baseUrl, name, spec, config.userAgent))
  }

  const homepage = results.find((r) => r.checkId === "homepage")
  const health = results.find((r) => r.checkId === "health")
  const healthDb = results.find((r) => r.checkId === "healthDb")

  const observedDeploymentId = extractDeploymentId(
    homepage?._scanBody || homepage?.bodySnippet,
  )
  const observedBuildTime = health?.json?.buildTime ?? null
  const database =
    health?.json?.database ?? healthDb?.json?.database ?? null

  const deploymentOk =
    observedDeploymentId == null ||
    observedDeploymentId === config.expectedDeploymentId
  const buildTimeOk =
    observedBuildTime == null ||
    observedBuildTime === config.expectedBuildTime
  const healthPayloadOk = Boolean(
    health?.pass && health?.json?.ok === true && database === "connected",
  )
  const dbPayloadOk = Boolean(
    healthDb?.pass && healthDb?.json?.ok === true && healthDb?.json?.database === "connected",
  )

  const identityCheck = {
    checkId: "deploymentIdentity",
    url: config.baseUrl,
    method: "DERIVED",
    timestamp: nowIso(),
    httpStatus: homepage?.httpStatus ?? null,
    durationMs: 0,
    pass: deploymentOk && buildTimeOk,
    expectStatus: null,
    bodySnippet: null,
    json: {
      expectedDeploymentId: config.expectedDeploymentId,
      observedDeploymentId,
      expectedBuildTime: config.expectedBuildTime,
      observedBuildTime,
      expectedShaPrefix: config.expectedShaPrefix,
    },
    errorSummary:
      deploymentOk && buildTimeOk
        ? null
        : "unexpected_production_deployment_or_build_time",
  }
  results.push(identityCheck)

  const healthSemantics = {
    checkId: "healthSemantics",
    url: health?.url ?? `${config.baseUrl}/api/health`,
    method: "DERIVED",
    timestamp: nowIso(),
    httpStatus: health?.httpStatus ?? null,
    durationMs: 0,
    pass: healthPayloadOk && dbPayloadOk,
    expectStatus: null,
    bodySnippet: null,
    json: { database, healthOk: health?.json?.ok ?? null, dbOk: healthDb?.json?.ok ?? null },
    errorSummary:
      healthPayloadOk && dbPayloadOk ? null : "health_or_database_not_ok",
  }
  results.push(healthSemantics)

  return {
    timestamp: nowIso(),
    baseUrl: config.baseUrl,
    deploymentId: observedDeploymentId ?? config.expectedDeploymentId,
    buildTime: observedBuildTime,
    results,
  }
}
