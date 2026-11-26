export type EnterpriseIdentityProvider = {
  id: "clerk" | "authjs" | "supabase-auth" | "custom-session"
  name: string
  strengths: string[]
  risks: string[]
  readiness: number
  recommendation: "PREFERRED" | "VIABLE" | "NEEDS_REVIEW"
}

export function buildIdentityProviderEvaluations(): EnterpriseIdentityProvider[] {
  return [
    {
      id: "clerk",
      name: "Clerk",
      strengths: ["Mature organization support", "Strong admin UX", "Fast integration path"],
      risks: ["External dependency", "Enterprise cost and data boundary review required"],
      readiness: 82,
      recommendation: "PREFERRED",
    },
    {
      id: "authjs",
      name: "Auth.js / NextAuth",
      strengths: ["Framework-native posture", "Provider flexibility", "Self-directed control"],
      risks: ["More tenant and organization modeling work", "Session hardening required"],
      readiness: 76,
      recommendation: "VIABLE",
    },
    {
      id: "supabase-auth",
      name: "Supabase Auth",
      strengths: ["Integrated auth and data platform", "Team-friendly operational model"],
      risks: ["May reshape current database and tenant boundary strategy"],
      readiness: 68,
      recommendation: "NEEDS_REVIEW",
    },
    {
      id: "custom-session",
      name: "Custom session approach",
      strengths: ["Maximum control", "Precise EV-KOS claim model"],
      risks: ["Highest security burden", "Slowest production readiness path"],
      readiness: 52,
      recommendation: "NEEDS_REVIEW",
    },
  ]
}

export function evaluateProviderReadiness(
  providers: EnterpriseIdentityProvider[] = buildIdentityProviderEvaluations()
) {
  const preferred = providers.find((provider) => provider.recommendation === "PREFERRED")
  const score = Math.round(
    providers.reduce((sum, provider) => sum + provider.readiness, 0) /
      providers.length
  )

  return {
    score,
    status: "PROVIDER_EVALUATED_NOT_INSTALLED" as const,
    providerRecommendation: preferred?.name ?? "Clerk",
    providerInstallation: false,
    authIntegration: false,
  }
}
