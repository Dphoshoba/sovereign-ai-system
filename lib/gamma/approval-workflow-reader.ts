import { getApprovalWorkflowMockData } from '../../src/lib/approval-workflow/mock-data'
import { ApprovalWorkflow } from '../../src/lib/approval-workflow/types'

export async function getApprovalWorkflowReader(): Promise<ApprovalWorkflow> {
  return getApprovalWorkflowMockData()
}
