/**
 * EV-OPS-02 alert policy + cross-runner emission gates.
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  resolveAlertPolicy,
  shouldEmitLiveNotification,
} from "../../ops/ev-ops-01/lib/alert-policy.mjs"
import { createNotifier } from "../../ops/ev-ops-01/lib/notify.mjs"

describe("EV-OPS-02 alert policy", () => {
  it("blocks live send when recipient is missing", () => {
    const policy = resolveAlertPolicy({
      MONITORING_ALERTS_LIVE: "1",
      MONITORING_ALERT_EMITTER: "cloud",
      MONITORING_RUNNER: "cloud",
      RESEND_API_KEY: "re_test",
    })
    assert.equal(policy.liveAllowed, false)
    assert.ok(policy.blockers.includes("MONITORING_ALERT_TO_missing"))
  })

  it("allows only the designated cloud emitter", () => {
    const cloud = resolveAlertPolicy({
      MONITORING_ALERTS_LIVE: "1",
      MONITORING_ALERT_EMITTER: "cloud",
      MONITORING_RUNNER: "cloud",
      MONITORING_ALERT_TO: "director@example.com",
      RESEND_API_KEY: "re_test",
    })
    const host = resolveAlertPolicy({
      MONITORING_ALERTS_LIVE: "1",
      MONITORING_ALERT_EMITTER: "cloud",
      MONITORING_RUNNER: "host",
      MONITORING_ALERT_TO: "director@example.com",
      RESEND_API_KEY: "re_test",
    })
    assert.equal(cloud.liveAllowed, true)
    assert.equal(host.liveAllowed, false)
    assert.equal(shouldEmitLiveNotification(cloud), true)
    assert.equal(shouldEmitLiveNotification(host), false)
  })

  it("host runner file-sinks while cloud emitter is designated (no duplicate live)", async () => {
    const root = mkdtempSync(join(tmpdir(), "ev-ops-02-"))
    const hostNotifier = createNotifier({
      rootDir: root,
      live: true,
      emitter: "cloud",
      runner: "host",
      alertTo: "director@example.com",
      resendApiKey: "re_test",
    })
    const record = await hostNotifier.notifyOpened({
      id: "abc",
      code: "production_unavailable",
      severity: "critical",
      summary: "test",
      startedAt: new Date().toISOString(),
      evidence: [],
    })
    assert.equal(record.dryRun, true)
    assert.equal(record.delivery, "file")
    assert.equal(record.runner, "host")
    assert.equal(record.emitter, "cloud")
    rmSync(root, { recursive: true, force: true })
  })
})
