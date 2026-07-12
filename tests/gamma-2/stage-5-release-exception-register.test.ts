import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-exception-register/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseExceptionRegister } from "../../src/lib/gamma-2/stage-5-release-exception-register";

describe("Gamma 2 Stage 5 release exception register", () => {
  it("builds a release exception register from compliance and gate contracts", () => {
    const register = buildGammaStage5ReleaseExceptionRegister();

    expect(register.id).toBe("gamma_2_stage_5_release_exception_register");
    expect(register.status).toBe("ready-for-exception-review");
    expect(register.branch).toBe("gamma");
    expect(register.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(register.apiSurfaceCount).toBe(39);
    expect(register.mappedControlCount).toBe(4);
    expect(register.openExceptionCount).toBe(0);
    expect(register.closedExceptionCount).toBe(4);
    expect(register.operatorRequiredCount).toBe(2);
  });

  it("closes release exception categories against evidence", () => {
    const register = buildGammaStage5ReleaseExceptionRegister();

    expect(register.exceptions).toEqual([
      {
        id: "no-unmapped-compliance-controls",
        category: "governance",
        status: "closed",
        evidence: "stage-5-compliance-controls-map-to-signoff-retention-and-evidence",
      },
      {
        id: "no-unretained-release-records",
        category: "archive",
        status: "closed",
        evidence: "stage-5-release-records-retained-until-next-attested-promotion",
      },
      {
        id: "operator-approval-required-for-promotion-exceptions",
        category: "approval",
        status: "closed",
        evidence: "operator-promotes-after-env-domain-and-evidence-review",
      },
      {
        id: "protected-rollback-tag-available",
        category: "rollback",
        status: "closed",
        evidence: "gamma-2-roadmap-complete",
      },
    ]);
    expect(register.exceptionRule).toBe(
      "stage-5-release-exceptions-require-operator-approval-before-promotion"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseExceptionRegister()).toEqual(
      buildGammaStage5ReleaseExceptionRegister()
    );
  });

  it("serves the register through the Stage 5 release exception register route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_exception_register");
    expect(body.apiSurfaceCount).toBe(39);
    expect(body.openExceptionCount).toBe(0);
    expect(body.exceptions).toHaveLength(4);
  });
});
