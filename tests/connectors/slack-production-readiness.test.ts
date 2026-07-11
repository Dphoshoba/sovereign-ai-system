import { describe, expect, it } from "vitest";
import {
  getSlackProductionReadiness,
  getSlackRetryPolicy,
  projectSlackHealth,
} from "../../lib/connectors/slack/production-readiness";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

describe("Slack production readiness", () => {
  it("satisfies the Gamma 2.0 Phase XV connector contract", () => {
    const readiness = getSlackProductionReadiness();

    expect(readiness.connectorId).toBe("slack");
    expect(readiness.priorityRank).toBe(5);
    expect(readiness.status).toBe("certification-ready");
    expect(readiness.missingCapabilities).toEqual([]);
    expect(readiness.blockers).toEqual([]);
  });

  it("can be marked production-ready with a passing certification score", () => {
    const readiness = getSlackProductionReadiness(92);

    expect(readiness.status).toBe("production-ready");
    expect(readiness.readinessScore).toBeGreaterThanOrEqual(90);
  });

  it("uses deterministic retry and health projections", () => {
    expect(getSlackRetryPolicy().scheduleSeconds).toEqual([5, 10, 20]);

    const health = projectSlackHealth({
      currentTime: BASE_TIME,
      quotaUsedPercent: 30,
      tokenExpiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
    });

    expect(health.status).toBe("healthy");
    expect(health.checkedAt).toEqual(BASE_TIME);
  });

  it("degrades for quota or token warnings and blocks expired tokens", () => {
    const degraded = projectSlackHealth({
      currentTime: BASE_TIME,
      quotaUsedPercent: 95,
      tokenExpiresAt: new Date(BASE_TIME.getTime() + 5 * 60000),
    });
    const blocked = projectSlackHealth({
      currentTime: BASE_TIME,
      quotaUsedPercent: 20,
      tokenExpiresAt: new Date(BASE_TIME.getTime() - 60000),
    });

    expect(degraded.status).toBe("degraded");
    expect(degraded.warnings.length).toBe(2);
    expect(blocked.status).toBe("blocked");
  });
});
