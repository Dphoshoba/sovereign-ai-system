/**
 * POST /api/flow/cancel
 * 
 * Cancels a running workflow execution
 */

// In production, this would interact with a persistent store (database, Redis, etc.)
// For now, we maintain an in-memory registry of active executions
const ACTIVE_EXECUTIONS = new Map<string, { state: string; cancelledAt?: Date }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { executionId } = body;

    if (!executionId) {
      return Response.json(
        { error: 'Missing executionId' },
        { status: 400 }
      );
    }

    const execution = ACTIVE_EXECUTIONS.get(executionId);
    
    if (!execution) {
      return Response.json(
        { error: `Execution ${executionId} not found or already completed` },
        { status: 404 }
      );
    }

    if (execution.state === 'cancelled' || execution.state === 'completed' || execution.state === 'failed') {
      return Response.json(
        { error: `Execution already in ${execution.state} state` },
        { status: 400 }
      );
    }

    // Mark as cancelled
    execution.state = 'cancelled';
    execution.cancelledAt = new Date();

    return Response.json({
      success: true,
      executionId,
      state: 'cancelled',
      cancelledAt: execution.cancelledAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const executionId = url.searchParams.get('executionId');

    if (!executionId) {
      return Response.json(
        { error: 'Missing executionId query parameter' },
        { status: 400 }
      );
    }

    const execution = ACTIVE_EXECUTIONS.get(executionId);
    
    if (!execution) {
      return Response.json(
        { state: 'unknown', message: 'Execution not found' },
        { status: 404 }
      );
    }

    return Response.json({
      executionId,
      state: execution.state,
      cancelledAt: execution.cancelledAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export function registerExecution(executionId: string): void {
  ACTIVE_EXECUTIONS.set(executionId, { state: 'running' });
}

export function completeExecution(executionId: string): void {
  const execution = ACTIVE_EXECUTIONS.get(executionId);
  if (execution) {
    execution.state = 'completed';
  }
}
