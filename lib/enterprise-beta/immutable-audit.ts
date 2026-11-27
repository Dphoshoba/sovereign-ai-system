export type ImmutableAuditControl = {
  id: string
  name: string
  controlType: "append-only" | "hash-chain" | "retention-lock" | "approval-delete"
  requiredForBetaRuntime: boolean
  active: false
}

export function buildImmutableAuditControls(): ImmutableAuditControl[] {
  return [
    {
      id: "immutable-append-only",
      name: "Append-only audit writes",
      controlType: "append-only",
      requiredForBetaRuntime: true,
      active: false,
    },
    {
      id: "immutable-hash-chain",
      name: "Hash chain integrity marker",
      controlType: "hash-chain",
      requiredForBetaRuntime: true,
      active: false,
    },
    {
      id: "immutable-retention-lock",
      name: "Retention lock",
      controlType: "retention-lock",
      requiredForBetaRuntime: true,
      active: false,
    },
    {
      id: "immutable-approval-delete",
      name: "Approval-bound deletion",
      controlType: "approval-delete",
      requiredForBetaRuntime: true,
      active: false,
    },
  ]
}

export function evaluateImmutabilityCoverage(
  controls: ImmutableAuditControl[] = buildImmutableAuditControls()
) {
  const required = controls.filter((control) => control.requiredForBetaRuntime).length

  return {
    score: Math.round((required / controls.length) * 88),
    status: "IMMUTABILITY_CONTROLS_DEFINED_NOT_ACTIVE" as const,
    controlCount: controls.length,
    active: false,
  }
}
