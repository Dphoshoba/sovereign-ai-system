/**
 * EV-OPS-01 monitoring unit tests (classification, dedupe, recovery).
 * Module: ops/ev-ops-01/lib/*
 * User instruction: verification of alert conditions and duplicate suppression.
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { loadConfig } from "../../ops/ev-ops-01/lib/config.mjs"
import { classifyCycle } from "../../ops/ev-ops-01/lib/classify.mjs"
import {
  ensureDirs,
  reconcileIncidents,
  loadState,
  saveState,
} from "../../ops/ev-ops-01/lib/state.mjs"

function baseCycle(pass, overrides = {}) {
  return {
    timestamp: new Date().toISOString(),
    baseUrl: "https://www.echoesandvisions.com",
    deploymentId: pass ? "dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo" : "dpl_OTHER",
    buildTime: pass ? "2026-11-18T09:45:18.361Z" : "2000-01-01T00:00:00.000Z",
    results: [
      {
        checkId: "homepage",
        httpStatus: pass ? 200 : 503,
        durationMs: 100,
        pass,
        errorSummary: pass ? null : "unexpected_status_503",
      },
      {
        checkId: "healthSemantics",
        httpStatus: pass ? 200 : 503,
        durationMs: 100,
        pass,
        errorSummary: pass ? null : "health_or_database_not_ok",
      },
      {
        checkId: "deploymentIdentity",
        httpStatus: 200,
        durationMs: 0,
        pass,
        errorSummary: pass ? null : "unexpected_production_deployment_or_build_time",
      },
      ...(overrides.results || []),
    ],
  }
}

describe("EV-OPS-01 classify + incident reconcile", () => {
  it("requires consecutive failures before critical incidents", () => {
    const config = loadConfig({ criticalFailureThreshold: 2 })
    const first = classifyCycle(baseCycle(false), config, {})
    assert.equal(first.incidents.length, 0)
    const second = classifyCycle(baseCycle(false), config, {
      failureStreaks: first.failureStreaks,
    })
    const codes = second.incidents.map((i) => i.code)
    assert.ok(codes.includes("production_unavailable"))
    assert.ok(codes.includes("unexpected_production_deployment"))
  })

  it("suppresses duplicate opens and emits recovery on clear", () => {
    const root = mkdtempSync(join(tmpdir(), "ev-ops-01-test-"))
    ensureDirs(root)
    const config = loadConfig({ criticalFailureThreshold: 1 })
    let state = loadState(root)

    const bad = classifyCycle(baseCycle(false), config, state)
    let reconciled = reconcileIncidents(state, bad)
    assert.ok(reconciled.opened.length >= 1)
    state.openIncidents = reconciled.openIncidents
    saveState(root, state)

    const badAgain = classifyCycle(baseCycle(false), config, {
      failureStreaks: bad.failureStreaks,
    })
    reconciled = reconcileIncidents(state, badAgain)
    assert.equal(reconciled.opened.length, 0)
    assert.ok(reconciled.stillOpen.length >= 1)
    state.openIncidents = reconciled.openIncidents

    const good = classifyCycle(baseCycle(true), config, {
      failureStreaks: badAgain.failureStreaks,
    })
    reconciled = reconcileIncidents(state, good)
    assert.ok(reconciled.resolved.length >= 1)
    rmSync(root, { recursive: true, force: true })
  })
})
