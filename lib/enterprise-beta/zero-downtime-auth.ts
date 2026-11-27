export type ZeroDowntimeAuthControl = {
  id: string
  title: string
  category: "dual-read" | "shadow-validation" | "feature-flag" | "rollback"
  required: boolean
  reportOnly: true
  runtimeEnabled: false
}

export function buildZeroDowntimeAuthControls(): ZeroDowntimeAuthControl[] {
  return [
    {
      id: "zero-downtime-dual-read",
      title: "Dual-read auth decision verification plan",
      category: "dual-read",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "zero-downtime-shadow-validation",
      title: "Shadow claim validation plan",
      category: "shadow-validation",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "zero-downtime-feature-flag",
      title: "Feature-flag controlled cutover plan",
      category: "feature-flag",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "zero-downtime-rollback",
      title: "Rollback-on-anomaly checkpoint plan",
      category: "rollback",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
  ]
}
