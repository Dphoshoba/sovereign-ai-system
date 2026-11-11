import { describe, expect, it, vi } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/promotion-checklist/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5PromotionChecklist } from "../../src/lib/gamma-2/stage-5-promotion-checklist";
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: "editor-1",
            email: "editor@example.com",
            app_metadata: { role: "editor" },
          },
        },
        error: null,
      }),
    },
  }),
}))


describe("Gamma 2 Stage 5 promotion checklist", () => {
  it("builds ordered operator promotion steps", () => {
    const checklist = buildGammaStage5PromotionChecklist();

    expect(checklist.id).toBe("gamma_2_stage_5_promotion_checklist");
    expect(checklist.status).toBe("operator-review-ready");
    expect(checklist.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(checklist.steps.map((step) => step.order)).toEqual([1, 2, 3, 4, 5]);
    expect(checklist.steps.filter((step) => step.status === "operator-required")).toHaveLength(2);
  });

  it("keeps rollback and approval boundaries explicit", () => {
    const checklist = buildGammaStage5PromotionChecklist();

    expect(checklist.rollbackPlan).toContain("Use the previous production deployment if promotion fails");
    expect(checklist.approvalBoundary).toBe("human-approval-before-production");
    expect(checklist.checklistRule).toBe("ordered-operator-steps-before-production-promotion");
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5PromotionChecklist()).toEqual(
      buildGammaStage5PromotionChecklist()
    );
  });

  it("serves the checklist through the Stage 5 promotion checklist route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_promotion_checklist");
    expect(body.status).toBe("operator-review-ready");
    expect(body.steps).toHaveLength(5);
  });
});
