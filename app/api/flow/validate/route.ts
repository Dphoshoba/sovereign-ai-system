/**
 * POST /api/flow/validate
 * 
 * Validates a workflow definition and returns comprehensive validation results
 */

import { validateWorkflow } from '../../../../lib/flow/workflow-validator';
import type { WorkflowDefinition } from '../../../../src/lib/gamma-flow/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const definition: WorkflowDefinition = body;

    if (!definition || !definition.id) {
      return Response.json(
        { error: 'Invalid workflow definition: missing id' },
        { status: 400 }
      );
    }

    const result = validateWorkflow(definition);

    return Response.json({
      success: true,
      valid: result.valid,
      safetyScore: result.safetyScore,
      readinessScore: result.readinessScore,
      connectorCoverage: result.connectorCoverage,
      approvalCoverage: result.approvalCoverage,
      errors: result.errors,
      warnings: result.warnings,
      metrics: result.metrics,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
