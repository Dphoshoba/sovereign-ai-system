import { DEPLOYMENT_ASSETS } from "../deployment/mock-data"
import type { DeploymentWorkspace } from "../deployment/types"

export async function getDeploymentRegistry(): Promise<DeploymentWorkspace> {
  return DEPLOYMENT_ASSETS
}
