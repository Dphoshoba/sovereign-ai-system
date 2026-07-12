import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-completion-certificate/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseCompletionCertificate } from "../../src/lib/gamma-2/stage-5-release-completion-certificate";

describe("Gamma 2 Stage 5 release completion certificate", () => {
  it("builds a pending operator completion certificate", () => {
    const certificate = buildGammaStage5ReleaseCompletionCertificate();

    expect(certificate.id).toBe("gamma_2_stage_5_release_completion_certificate");
    expect(certificate.status).toBe("pending-operator-certification");
    expect(certificate.branch).toBe("gamma");
    expect(certificate.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(certificate.apiSurfaceCount).toBe(38);
    expect(certificate.phaseCount).toBe(11);
    expect(certificate.closureEntryCount).toBe(6);
    expect(certificate.closeoutItemCount).toBe(6);
    expect(certificate.retentionRuleCount).toBe(4);
    expect(certificate.passCheckCount).toBe(3);
    expect(certificate.openExceptionCount).toBe(0);
    expect(certificate.smoke).toBe("61 routes passed, 0 failed");
  }, 30000);

  it("binds the release completion evidence sequence", () => {
    const certificate = buildGammaStage5ReleaseCompletionCertificate();

    expect(certificate.evidence).toEqual([
      {
        order: 1,
        id: "readiness-snapshot-bound",
        source: "/api/gamma/stage-5/readiness",
        evidence: "gamma-2-roadmap-complete",
        owner: "operator",
        status: "pending-operator-certification",
      },
      {
        order: 2,
        id: "closure-ledger-bound",
        source: "/api/gamma/stage-5/release-closure-ledger",
        evidence:
          "stage-5-release-closure-ledger-requires-attestation-decision-receipt-audit-operations-and-closeout",
        owner: "operator",
        status: "pending-operator-certification",
      },
      {
        order: 3,
        id: "closeout-packet-bound",
        source: "/api/gamma/stage-5/release-closeout-packet",
        evidence:
          "stage-5-release-closeout-requires-operations-review-bundle-archive-retention-and-rollback-evidence",
        owner: "operator",
        status: "pending-operator-certification",
      },
      {
        order: 4,
        id: "retention-policy-bound",
        source: "/api/gamma/stage-5/release-retention-policy",
        evidence: "stage-5-release-records-retained-until-next-attested-promotion",
        owner: "operator",
        status: "pending-operator-certification",
      },
      {
        order: 5,
        id: "release-attestation-bound",
        source: "/api/gamma/stage-5/release-attestation",
        evidence: "digest-verification-and-release-gate-required-for-promotion",
        owner: "release-client",
        status: "pending-operator-certification",
      },
    ]);
    expect(certificate.certificateRule).toBe(
      "stage-5-release-completion-certificate-requires-readiness-closure-closeout-retention-and-attestation"
    );
  }, 30000);

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseCompletionCertificate()).toEqual(
      buildGammaStage5ReleaseCompletionCertificate()
    );
  }, 30000);

  it("serves the certificate through the Stage 5 release completion certificate route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_completion_certificate");
    expect(body.apiSurfaceCount).toBe(38);
    expect(body.status).toBe("pending-operator-certification");
    expect(body.evidence).toHaveLength(5);
  }, 30000);
});
