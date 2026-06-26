import { NextResponse } from "next/server"

import { OPERATOR_AUTH_CONTRACT_STATUS } from "../../../../lib/security/operator-auth"
import { listOperatorPermissions } from "../../../../lib/security/operator-permissions"
import { listOperatorRoles } from "../../../../lib/security/operator-roles"
import {
  listRateLimitPolicies,
  summarizeRateLimitPolicies,
} from "../../../../lib/security/rate-limit-policy"
import {
  validateEnvironment,
  validateProductionReadiness,
} from "../../../../lib/security/startup-validation"

export async function GET() {
  const roles = listOperatorRoles()
  const permissions = listOperatorPermissions()
  const rateLimitSummary = summarizeRateLimitPolicies()
  const startup = validateEnvironment()
  const production = validateProductionReadiness()
  const operatorAuthReadiness = 55
  const authorizationReadiness = 72
  const rateLimitingReadiness = 68
  const startupValidationReadiness = startup.score
  const securityReadinessScore = Math.round(
    [
      operatorAuthReadiness,
      authorizationReadiness,
      rateLimitingReadiness,
      startupValidationReadiness,
    ].reduce((sum, score) => sum + score, 0) / 4
  )
  const releaseBlockers = [
    "No authentication provider is integrated in RC-2.",
    "No session handling or JWT implementation exists in RC-2.",
    "Rate-limit policies are defined but not enforced.",
    "Startup validation is report-only and does not block boot.",
    ...production.releaseBlockers,
  ]

  return NextResponse.json({
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    execution: false,
    openAiCalls: false,
    publishing: false,
    socialPosting: false,
    graphWrites: false,
    graphDeletes: false,
    automaticApprovals: false,
    securityReadinessScore,
    operatorAuthStatus: {
      status: "PARTIAL",
      readiness: operatorAuthReadiness,
      ...OPERATOR_AUTH_CONTRACT_STATUS,
      summary:
        "Canonical operator auth interfaces exist, but no provider, sessions, JWTs, or enforcement are integrated.",
    },
    authorizationStatus: {
      status: "PARTIAL",
      readiness: authorizationReadiness,
      roles: roles.length,
      permissions: permissions.length,
      summary:
        "Roles, permissions, route allowances, approval capabilities, and write capabilities are defined as contracts.",
    },
    rateLimitStatus: {
      status: "PARTIAL",
      readiness: rateLimitingReadiness,
      ...rateLimitSummary,
      policies: listRateLimitPolicies(),
    },
    startupValidationStatus: {
      status: startup.status,
      readiness: startupValidationReadiness,
      enforcementEnabled: startup.enforcementEnabled,
      missingRequired: startup.missingRequired,
    },
    releaseBlockers,
    recommendedActions: [
      "Select and integrate the production authentication provider in a later RC.",
      "Bind operator roles to authenticated identities.",
      "Turn rate-limit policy definitions into middleware or route guards after approval.",
      "Enable startup validation enforcement only after environment parity is verified.",
      "Keep execution, OpenAI generation, publishing, and graph writes blocked until security gates are enforced.",
    ],
  })
}
