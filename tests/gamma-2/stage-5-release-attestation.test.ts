import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-attestation/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseAttestation } from "../../src/lib/gamma-2/stage-5-release-attestation";

describe("Gamma 2 Stage 5 release attestation", () => {
  it("builds a promotion-ready attestation from digest, verification, and release checks", () => {
    const attestation = buildGammaStage5ReleaseAttestation();

    expect(attestation.id).toBe("gamma_2_stage_5_release_attestation");
    expect(attestation.status).toBe("ready-for-attested-promotion");
    expect(attestation.branch).toBe("gamma");
    expect(attestation.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(attestation.digest.algorithm).toBe("sha256");
    expect(attestation.digest.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(attestation.digest.endpointCount).toBe(24);
    expect(attestation.verification.smoke).toBe("47 routes passed, 0 failed");
    expect(attestation.releaseChecks).toEqual({ pass: 3, operatorRequired: 2, total: 5 });
  });

  it("keeps promotion behind the human operator rule", () => {
    const attestation = buildGammaStage5ReleaseAttestation();

    expect(attestation.operatorRule).toBe("human-approval-before-production");
    expect(attestation.attestationRule).toBe(
      "digest-verification-and-release-gate-required-for-promotion"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseAttestation()).toEqual(
      buildGammaStage5ReleaseAttestation()
    );
  });

  it("serves the attestation through the Stage 5 release attestation route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_attestation");
    expect(body.digest.endpointCount).toBe(24);
    expect(body.operatorRule).toBe("human-approval-before-production");
  });
});
