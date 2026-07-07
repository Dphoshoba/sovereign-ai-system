import { WORKFLOW_ENGINE_ASSETS } from "../workflow-engine/mock-data"
import type { WorkflowEngineWorkspace } from "../workflow-engine/types"

export async function getWorkflowEngineRegistry(): Promise<WorkflowEngineWorkspace> {
  return WORKFLOW_ENGINE_ASSETS
}
