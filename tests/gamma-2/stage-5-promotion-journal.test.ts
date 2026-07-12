import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/promotion-journal/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5PromotionJournal } from "../../src/lib/gamma-2/stage-5-promotion-journal";

describe("Gamma 2 Stage 5 promotion journal", () => {
  it("builds an operator signoff journal from receipt, audit, attestation, and rollback evidence", () => {
    const journal = buildGammaStage5PromotionJournal();

    expect(journal.id).toBe("gamma_2_stage_5_promotion_journal");
    expect(journal.status).toBe("ready-for-operator-signoff");
    expect(journal.branch).toBe("gamma");
    expect(journal.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(journal.digestFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(journal.apiSurfaceCount).toBe(34);
    expect(journal.receiptStatus).toBe("ready-for-post-promotion-record");
    expect(journal.auditEntryCount).toBe(4);
    expect(journal.rollbackTag).toBe("gamma-2-roadmap-complete");
  });

  it("captures the ordered promotion evidence sequence", () => {
    const journal = buildGammaStage5PromotionJournal();

    expect(journal.entries.map((entry) => entry.order)).toEqual([1, 2, 3, 4, 5]);
    expect(journal.entries[0]).toMatchObject({
      checkpoint: "Deployment receipt prepared",
      source: "/api/gamma/stage-5/deployment-receipt",
    });
    expect(journal.entries[4]).toMatchObject({
      checkpoint: "Promotion surface verified",
      evidence: "57 routes passed, 0 failed",
      source: "/api/gamma/stage-5/deployment-summary",
    });
    expect(journal.journalArtifacts).toEqual([
      "/api/gamma/stage-5/deployment-receipt",
      "/api/gamma/stage-5/release-attestation",
      "/api/gamma/stage-5/audit-ledger",
      "/api/gamma/stage-5/rollback-plan",
      "/api/gamma/stage-5/deployment-summary",
    ]);
    expect(journal.journalRule).toBe(
      "promotion-journal-must-bind-receipt-attestation-audit-and-rollback"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5PromotionJournal()).toEqual(buildGammaStage5PromotionJournal());
  });

  it("serves the journal through the Stage 5 promotion journal route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_promotion_journal");
    expect(body.apiSurfaceCount).toBe(34);
    expect(body.entries).toHaveLength(5);
  });
});
