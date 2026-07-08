import type { GammaCloudWorkspace } from "./types"

export const GAMMA_CLOUD_ASSETS: GammaCloudWorkspace = {
  regions: [
    { id: "region-us-east", name: "US East (Virginia)", status: "online", organizationCount: 412, latency: 12 },
    { id: "region-us-west", name: "US West (Oregon)", status: "online", organizationCount: 289, latency: 18 },
    { id: "region-eu-west", name: "EU West (Ireland)", status: "online", organizationCount: 198, latency: 24 },
    { id: "region-ap-south", name: "Asia Pacific (Singapore)", status: "online", organizationCount: 143, latency: 31 },
    { id: "region-au-east", name: "Australia East (Sydney)", status: "degraded", organizationCount: 78, latency: 42 },
  ],
  metrics: {
    organizations: 1120,
    users: 48750,
    aiAgents: 2312,
    deployments: 3,
    licenses: 3,
    revenue: 1138200,
    marketplaceModules: 5,
    health: 96,
    regions: 5,
    liveStatus: "operational",
  },
}
