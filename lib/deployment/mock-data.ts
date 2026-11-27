import type { DeploymentWorkspace } from "./types"

const FIXED_TIMESTAMP = 1751990400000

export const DEPLOYMENT_ASSETS: DeploymentWorkspace = {
  targets: [
    { id: "dep-docker", name: "docker", displayName: "Docker", status: "deployed", region: "local", deployedAt: FIXED_TIMESTAMP, healthScore: 98 },
    { id: "dep-railway", name: "railway", displayName: "Railway", status: "deployed", region: "us-west-2", deployedAt: FIXED_TIMESTAMP, healthScore: 96 },
    { id: "dep-vercel", name: "vercel", displayName: "Vercel", status: "deployed", region: "global", deployedAt: FIXED_TIMESTAMP, healthScore: 99 },
    { id: "dep-azure", name: "azure", displayName: "Microsoft Azure", status: "available", region: "eastus", deployedAt: FIXED_TIMESTAMP, healthScore: 0 },
    { id: "dep-aws", name: "aws", displayName: "Amazon Web Services", status: "available", region: "us-east-1", deployedAt: FIXED_TIMESTAMP, healthScore: 0 },
    { id: "dep-gcp", name: "gcp", displayName: "Google Cloud Platform", status: "available", region: "us-central1", deployedAt: FIXED_TIMESTAMP, healthScore: 0 },
    { id: "dep-do", name: "digitalocean", displayName: "DigitalOcean", status: "available", region: "nyc3", deployedAt: FIXED_TIMESTAMP, healthScore: 0 },
  ],
  metrics: {
    totalTargets: 7,
    activeDeployments: 3,
    successRate: 98,
    avgDeployTime: 145,
    healthScore: 97,
  },
}
