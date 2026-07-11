import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/audit-ledger/route";
import { buildGammaStage5AuditLedger } from "../../src/lib/gamma-2/stage-5-audit-ledger";

describe("Gamma 2 Stage 5 audit ledger", () => {
  it("builds an ordered audit ledger for release evidence", () => {
    const ledger = buildGammaStage5AuditLedger();

    expect(ledger.id).toBe("gamma_2_stage_5_audit_ledger");
    expect(ledger.status).toBe("audit-ready");
    expect(ledger.branch).toBe("gamma");
    expect(ledger.digestFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(ledger.apiSurfaceCount).toBe(28);
    expect(ledger.entries.map((entry) => entry.order)).toEqual([1, 2, 3, 4]);
    expect(ledger.entries[0].evidence).toBe("51 routes passed, 0 failed");
  });

  it("lists required release evidence artifacts", () => {
    const ledger = buildGammaStage5AuditLedger();

    expect(ledger.artifactPaths).toEqual([
      "/api/gamma/stage-5/deployment-summary",
      "/api/gamma/stage-5/release-attestation",
      "/api/gamma/stage-5/rollback-plan",
      "/api/gamma/stage-5/operator-handoff",
      "/api/gamma/stage-5/contract-digest",
    ]);
    expect(ledger.auditRule).toBe("ordered-ledger-for-stage-5-release-evidence");
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5AuditLedger()).toEqual(buildGammaStage5AuditLedger());
  });

  it("serves the ledger through the Stage 5 audit ledger route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_audit_ledger");
    expect(body.apiSurfaceCount).toBe(28);
    expect(body.auditRule).toBe("ordered-ledger-for-stage-5-release-evidence");
  });
});
