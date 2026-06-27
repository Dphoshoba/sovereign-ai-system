import { buildEnterpriseEnvironments } from "./environment-model"

export type EnvironmentPromotionPath = {
  id: string
  from: string
  to: string
  allowed: boolean
  requiredGates: string[]
  productionPromotion: boolean
}

export function buildEnvironmentPromotionPaths(): EnvironmentPromotionPath[] {
  const environments = new Set(buildEnterpriseEnvironments().map((env) => env.id))
  const paths: EnvironmentPromotionPath[] = [
    {
      id: "local-to-preview",
      from: "local",
      to: "preview",
      allowed: true,
      requiredGates: ["build-smoke-gate"],
      productionPromotion: false,
    },
    {
      id: "preview-to-staging",
      from: "preview",
      to: "staging",
      allowed: true,
      requiredGates: ["enterprise-guard-gate"],
      productionPromotion: false,
    },
    {
      id: "staging-to-production",
      from: "staging",
      to: "production",
      allowed: false,
      requiredGates: ["auth-enforcement-gate", "observability-gate"],
      productionPromotion: true,
    },
  ]

  return paths.filter((path) => environments.has(path.from) && environments.has(path.to))
}

export function evaluateEnvironmentPromotionSafety(
  paths: EnvironmentPromotionPath[] = buildEnvironmentPromotionPaths()
) {
  const productionBlocked = paths
    .filter((path) => path.productionPromotion)
    .every((path) => path.allowed === false)
  const allHaveGates = paths.every((path) => path.requiredGates.length > 0)
  const hasPromotionPath = paths.length > 0
  const checks = [productionBlocked, allHaveGates, hasPromotionPath]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "ENVIRONMENT_PROMOTION_PREVIEW_READY" as const,
    pathCount: paths.length,
    productionBlocked,
  }
}

