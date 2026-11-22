/**
 * EV-OPS-01 Production monitoring configuration.
 * Callers: ops/ev-ops-01/run-check.mjs, simulate-alerts.mjs, GitHub Actions workflow.
 * Existing health endpoints are public read-only; no privileged diagnostics.
 * User instruction: establish persistent Production monitoring with alerts and evidence.
 */

export const MONITORING_PROGRAM = "EV-OPS-01"

export const DEFAULT_CONFIG = {
  baseUrl: "https://www.echoesandvisions.com",
  // LIVE Production pin after EV-EDITORIAL-07 certified deploy (3d5ead0d).
  expectedDeploymentId: "dpl_5WC3WFxwRXSSMYhZw4ehPTB1LTju",
  // /api/health no longer exposes buildTime; deployment id is the identity pin.
  expectedBuildTime: null,
  expectedShaPrefix: "3d5ead0d",
  intervalMinutes: 5,
  criticalFailureThreshold: 2,
  slowResponseThreshold: 3,
  slowResponseMs: 5000,
  retentionDays: 30,
  userAgent: "EchoesVisions-EV-OPS-01-Monitor/1.0",
  checks: {
    homepage: { path: "/", method: "GET", expectStatus: [200] },
    health: { path: "/api/health", method: "GET", expectStatus: [200] },
    healthDb: { path: "/api/health/db", method: "GET", expectStatus: [200] },
    directorAuth: {
      path: "/api/agents/director",
      method: "POST",
      expectStatus: [401],
      body: "{}",
      headers: { "content-type": "application/json" },
    },
    cronPipelineAuth: {
      path: "/api/cron/run-pipeline",
      method: "GET",
      expectStatus: [401],
    },
    cronPublishAuth: {
      path: "/api/cron/publish-scheduled",
      method: "GET",
      expectStatus: [401],
    },
    socialTwitterAuth: {
      path: "/api/social/publish/twitter",
      method: "POST",
      expectStatus: [401],
      body: "{}",
      headers: { "content-type": "application/json" },
    },
  },
}

export function loadConfig(overrides = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    checks: { ...DEFAULT_CONFIG.checks, ...(overrides.checks || {}) },
  }
}
