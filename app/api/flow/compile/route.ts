/**
 * POST /api/flow/compile
 * 
 * Compiles validated workflow to execution plan with topological ordering
 */

import { validateWorkflow } from '../../../../lib/flow/workflow-validator';
import { compileWorkflow } from '../../../../lib/flow/workflow-compiler';
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

    // First validate the workflow
    const validation = validateWorkflow(definition);
    if (!validation.valid) {
      return Response.json(
        {
          error: 'Workflow validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // Compile to execution plan
    const compiled = compileWorkflow(definition);

    return Response.json({
      success: true,
      workflowId: compiled.id,
      stepCount: compiled.steps.length,
      edgeCount: compiled.edges.size,
      criticalPathLength: compiled.criticalPath.length,
      estimatedExecutionTime: compiled.executionTimeEstimate,
      parallelizable: compiled.parallelizable,
      steps: compiled.steps.map((step: any) => ({
        order: step.order,
        stepId: step.stepId,
        stepType: step.stepType,
        dependencies: step.dependencies,
      })),
      criticalPath: compiled.criticalPath,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
