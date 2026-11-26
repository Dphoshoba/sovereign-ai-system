import {
  buildAuthAbstractionContracts,
  evaluateAuthAbstractionReadiness,
} from "./auth-abstraction"
import {
  buildEnterpriseIdentityModels,
  evaluateIdentityReadiness,
} from "./identity-model"
import {
  buildIdentityProviderEvaluations,
  evaluateProviderReadiness,
} from "./identity-provider-evaluation"
import {
  buildExampleOperatorIdentity,
  summarizeOperatorIdentity,
} from "./operator-identity"
import { buildPermissionContext, summarizePermissionContext } from "./permission-context"
import { buildSessionContracts, evaluateSessionReadiness } from "./session-contract"
import { buildTenantClaims, evaluateTenantClaimReadiness } from "./tenant-claims"

export function buildEnterpriseBetaIdentityReadiness() {
  const identities = buildEnterpriseIdentityModels()
  const providers = buildIdentityProviderEvaluations()
  const sessions = buildSessionContracts()
  const tenantClaims = buildTenantClaims()
  const authAbstractions = buildAuthAbstractionContracts()
  const operatorIdentity = buildExampleOperatorIdentity()
  const permissionContext = buildPermissionContext()

  const identityReadiness = evaluateIdentityReadiness(identities)
  const providerReadiness = evaluateProviderReadiness(providers)
  const sessionReadiness = evaluateSessionReadiness(sessions)
  const tenantClaimReadiness = evaluateTenantClaimReadiness(tenantClaims)
  const abstractionReadiness = evaluateAuthAbstractionReadiness(authAbstractions)

  const identityScore = Math.round(
    [
      identityReadiness.score,
      providerReadiness.score,
      sessionReadiness.score,
      tenantClaimReadiness.score,
      abstractionReadiness.score,
    ].reduce((sum, score) => sum + score, 0) / 5
  )
  const betaReadiness = Math.round(
    [identityScore, providerReadiness.score, tenantClaimReadiness.score].reduce(
      (sum, score) => sum + score,
      0
    ) / 3
  )

  return {
    ok: true,
    readOnly: true,
    reportOnly: true,
    persistence: false,
    writesToPrisma: false,
    databaseWrites: false,
    schemaChanges: false,
    migrations: false,
    execution: false,
    publishing: false,
    graphWrites: false,
    graphDeletes: false,
    openAiCalls: false,
    authIntegration: false,
    providerInstallation: false,
    sessionsEnabled: false,
    jwtIssued: false,
    identityScore,
    providerRecommendation: providerReadiness.providerRecommendation,
    sessionScore: sessionReadiness.score,
    tenantClaimScore: tenantClaimReadiness.score,
    betaReadiness,
    identityReadiness: identityReadiness.score,
    providerReadiness: providerReadiness.score,
    sessionReadiness: sessionReadiness.score,
    tenantClaimReadiness: tenantClaimReadiness.score,
    abstractionReadiness: abstractionReadiness.score,
    recommendedEB2:
      "EB-2 should define report-only route guard coverage and tenant boundary enforcement plans without adding middleware, sessions, JWT, or provider integration.",
    identities,
    providers,
    sessions,
    tenantClaims,
    authAbstractions,
    operatorIdentity,
    operatorIdentitySummary: summarizeOperatorIdentity(operatorIdentity),
    permissionContext,
    permissionContextSummary: summarizePermissionContext(permissionContext),
    evaluations: {
      identityReadiness,
      providerReadiness,
      sessionReadiness,
      tenantClaimReadiness,
      abstractionReadiness,
    },
  }
}
