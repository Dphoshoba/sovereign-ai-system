export type AuthRolloutCheckpoint = {
  id: string
  title: string
  required: boolean
  complete: boolean
  domain: "provider" | "bootstrap" | "claims" | "cutover" | "migration"
}

export function buildAuthRolloutCheckpoints(): AuthRolloutCheckpoint[] {
  return [
    {
      id: "auth-rollout-provider",
      title: "Provider rollout plan checkpoint",
      required: true,
      complete: true,
      domain: "provider",
    },
    {
      id: "auth-rollout-bootstrap",
      title: "Session bootstrap checkpoint",
      required: true,
      complete: true,
      domain: "bootstrap",
    },
    {
      id: "auth-rollout-claims",
      title: "Claim validation checkpoint",
      required: true,
      complete: true,
      domain: "claims",
    },
    {
      id: "auth-rollout-cutover",
      title: "Zero-downtime cutover checkpoint",
      required: true,
      complete: true,
      domain: "cutover",
    },
    {
      id: "auth-rollout-migration",
      title: "Identity migration checkpoint",
      required: true,
      complete: true,
      domain: "migration",
    },
  ]
}
