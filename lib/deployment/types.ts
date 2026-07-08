export type DeploymentPlatform =
  | "docker"
  | "railway"
  | "vercel"
  | "azure"
  | "aws"
  | "gcp"
  | "digitalocean"

export type DeploymentStatus = "available" | "deployed" | "error"

export type DeploymentTarget = {
  id: string
  name: DeploymentPlatform
  displayName: string
  status: DeploymentStatus
  region: string
  deployedAt: number
  healthScore: number
}

export type DeploymentMetrics = {
  totalTargets: number
  activeDeployments: number
  successRate: number
  avgDeployTime: number
  healthScore: number
}

export type DeploymentWorkspace = {
  targets: DeploymentTarget[]
  metrics: DeploymentMetrics
}
