export type PromotionThreshold = {
  id: string
  metric:
    | "auth-success-rate"
    | "claim-integrity-rate"
    | "approval-gate-pass-rate"
    | "rollback-drill-pass-rate"
  minValue: number
  required: boolean
  reportOnly: true
}

export function buildPromotionThresholds(): PromotionThreshold[] {
  return [
    {
      id: "promotion-auth-success-rate",
      metric: "auth-success-rate",
      minValue: 99,
      required: true,
      reportOnly: true,
    },
    {
      id: "promotion-claim-integrity-rate",
      metric: "claim-integrity-rate",
      minValue: 99,
      required: true,
      reportOnly: true,
    },
    {
      id: "promotion-approval-pass-rate",
      metric: "approval-gate-pass-rate",
      minValue: 100,
      required: true,
      reportOnly: true,
    },
    {
      id: "promotion-rollback-drill-pass-rate",
      metric: "rollback-drill-pass-rate",
      minValue: 100,
      required: true,
      reportOnly: true,
    },
  ]
}
