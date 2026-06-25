export type GovernedIngestionDecision =
  | "ALLOW"
  | "ALLOW_WITH_WARNING"
  | "REQUIRES_REVIEW"
  | "BLOCK"

export type GovernanceEvaluationInput = {
  dryRun: boolean
  validationErrors: string[]
  validationWarnings: string[]
  riskScore: number
  duplicateRisk: number
  ontologyConfidence: number
  relationshipConfidence: number
}

export type GovernanceEvaluationResult = {
  decision: GovernedIngestionDecision
  approvalRequired: boolean
  warnings: string[]
  errors: string[]
  reasons: string[]
}

export function evaluateGovernanceRules(
  input: GovernanceEvaluationInput
): GovernanceEvaluationResult {
  const warnings = [...input.validationWarnings]
  const errors = [...input.validationErrors]
  const reasons: string[] = []

  if (!input.dryRun) {
    errors.push("Governed ingestion must remain dry-run until Phase 4C.")
    reasons.push("Non-dry-run requests are blocked.")
  }

  if (input.validationErrors.length > 0) {
    reasons.push("Validation errors must be resolved before review or approval.")
  }

  if (input.riskScore >= 85) {
    errors.push(`Risk score ${input.riskScore} exceeds the block threshold.`)
    reasons.push("High-risk ingestion is blocked.")
  }

  if (input.ontologyConfidence < 0.35) {
    errors.push(
      `Ontology confidence ${formatConfidence(input.ontologyConfidence)} is below the block threshold.`
    )
    reasons.push("Ontology confidence is too low for graph ingestion.")
  }

  if (input.relationshipConfidence < 0.3) {
    errors.push(
      `Relationship confidence ${formatConfidence(input.relationshipConfidence)} is below the block threshold.`
    )
    reasons.push("Relationship confidence is too low for graph ingestion.")
  }

  if (errors.length > 0) {
    return {
      decision: "BLOCK",
      approvalRequired: true,
      warnings,
      errors,
      reasons,
    }
  }

  if (input.duplicateRisk >= 60) {
    warnings.push(`Duplicate risk ${input.duplicateRisk} requires human review.`)
    reasons.push("Possible duplicate nodes need review before write enablement.")
  }

  if (input.riskScore >= 60) {
    warnings.push(`Risk score ${input.riskScore} requires human review.`)
    reasons.push("Overall graph quality risk is elevated.")
  }

  if (input.ontologyConfidence < 0.65) {
    warnings.push(
      `Ontology confidence ${formatConfidence(input.ontologyConfidence)} requires review.`
    )
    reasons.push("Ontology confidence is below direct-allow threshold.")
  }

  if (input.relationshipConfidence < 0.6) {
    warnings.push(
      `Relationship confidence ${formatConfidence(input.relationshipConfidence)} requires review.`
    )
    reasons.push("Relationship confidence is below direct-allow threshold.")
  }

  if (reasons.length > 0) {
    return {
      decision: "REQUIRES_REVIEW",
      approvalRequired: true,
      warnings,
      errors,
      reasons,
    }
  }

  if (warnings.length > 0 || input.duplicateRisk > 0 || input.riskScore >= 35) {
    return {
      decision: "ALLOW_WITH_WARNING",
      approvalRequired: false,
      warnings,
      errors,
      reasons: ["Plan is structurally valid but should be reviewed in logs."],
    }
  }

  return {
    decision: "ALLOW",
    approvalRequired: false,
    warnings,
    errors,
    reasons: ["Plan is valid, low risk, and dry-run only."],
  }
}

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`
}
