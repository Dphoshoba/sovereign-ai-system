/**
 * POST /api/flow/preview
 * 
 * Executes workflow in preview mode with mock connectors
 */

import { validateWorkflow } from '../../../../lib/flow/workflow-validator';
import { previewWorkflowWithInputs } from '../../../../lib/flow/workflow-preview-engine';
import type { WorkflowDefinition } from '../../../../src/lib/gamma-flow/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { definition, inputs, executionId } = body;

    if (!definition || !definition.id) {
      return Response.json(
        { error: 'Invalid workflow definition: missing id' },
        { status: 400 }
      );
    }

    // Validate first
    const validation = validateWorkflow(definition as WorkflowDefinition);
    if (!validation.valid) {
      return Response.json(
        {
          error: 'Workflow validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Run preview
    const previewResult = await previewWorkflowWithInputs(
      definition as WorkflowDefinition,
      executionId || `preview_${Date.now()}`,
      inputs || {}
    );

    return Response.json({
      success: previewResult.success,
      executionId: previewResult.executionId,
      stepResults: previewResult.stepResults,
      approvalCheckpoints: previewResult.approvalCheckpoints,
      errors: previewResult.errors,
      stats: {
        totalSteps: Object.keys(previewResult.stepResults).length,
        successfulSteps: Object.values(previewResult.stepResults).filter((r: any) => !r.error).length,
        failedSteps: Object.values(previewResult.stepResults).filter((r: any) => r.error).length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
