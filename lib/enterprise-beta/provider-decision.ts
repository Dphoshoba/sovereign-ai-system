import { buildProviderComparisons, evaluateProviderCoverage } from "./provider-comparison"

export type ProviderDecisionCheckpoint = {
  id: string
  title: string
  required: boolean
  complete: boolean
  notes: string
}

export function buildProviderDecisionCheckpoints(): ProviderDecisionCheckpoint[] {
  return [
    {
      id: "provider-check-tenant-claims",
      title: "Tenant claim compatibility validated",
      required: true,
      complete: true,
      notes: "EB-6 confirms candidate providers can represent tenant boundaries.",
    },
    {
      id: "provider-check-session-governance",
      title: "Session governance compatibility validated",
      required: true,
      complete: true,
      notes: "Session lifecycle and revocation checkpoints are defined in report-only form.",
    },
    {
      id: "provider-check-audit-linkage",
      title: "Audit persistence linkage planned",
      required: true,
      complete: true,
      notes: "Provider decision remains blocked until EB-5 persistence planning outputs are used in EB-7.",
    },
    {
      id: "provider-check-installation-block",
      title: "Installation blocked in EB-6",
      required: true,
      complete: true,
      notes: "No auth integration or package installation is allowed in EB-6.",
    },
  ]
}

export function buildProviderDecisionReport() {
  const comparisons = buildProviderComparisons()
  const providerCoverage = evaluateProviderCoverage(comparisons)
  const checkpoints = buildProviderDecisionCheckpoints()
  const completeRequired = checkpoints.filter(
    (checkpoint) => checkpoint.required && checkpoint.complete
  ).length

  return {
    decisionMode: "REPORT_ONLY" as const,
    selectedProvider: "NONE_IN_EB6" as const,
    providerCoverage: Math.round(
      (providerCoverage.score + Math.round((completeRequired / checkpoints.length) * 100)) / 2
    ),
    checkpoints,
    comparisons,
    installBlockedInEb6: true,
  }
}
