export type EnforcementPlanningStep = {
  id: string
  name: string
  order: number
  allowedInEB2: boolean
  requiresApprovalBeforeImplementation: boolean
}

export function buildEnforcementPlan(): EnforcementPlanningStep[] {
  return [
    {
      id: "plan-route-inventory",
      name: "Complete high-risk route inventory.",
      order: 1,
      allowedInEB2: true,
      requiresApprovalBeforeImplementation: false,
    },
    {
      id: "plan-report-only-wrapper",
      name: "Design report-only route guard wrapper.",
      order: 2,
      allowedInEB2: true,
      requiresApprovalBeforeImplementation: true,
    },
    {
      id: "plan-auth-source",
      name: "Select identity provider and session source.",
      order: 3,
      allowedInEB2: false,
      requiresApprovalBeforeImplementation: true,
    },
    {
      id: "plan-enforcing-middleware",
      name: "Implement enforcing middleware.",
      order: 4,
      allowedInEB2: false,
      requiresApprovalBeforeImplementation: true,
    },
  ]
}

export function evaluateEnforcementReadiness(
  plan: EnforcementPlanningStep[] = buildEnforcementPlan()
) {
  const planningReady = plan.filter((step) => step.allowedInEB2).length

  return {
    score: Math.round((planningReady / plan.length) * 76),
    status: "ENFORCEMENT_PLANNED_NOT_IMPLEMENTED" as const,
    stepCount: plan.length,
    implementationBlocked: true,
  }
}
