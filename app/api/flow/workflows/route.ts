/**
 * GET /api/flow/workflows
 * 
 * Lists all workflows or searches for specific workflows
 */

// In-memory workflow store for demo
const WORKFLOW_STORE = new Map<string, {
  id: string;
  name: string;
  description: string;
  state: string;
  createdAt: Date;
  lastExecutedAt?: Date;
  executionCount: number;
}>();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let workflows = Array.from(WORKFLOW_STORE.values());

    // Filter by search term
    if (search) {
      const lowerSearch = search.toLowerCase();
      workflows = workflows.filter(
        w =>
          w.name.toLowerCase().includes(lowerSearch) ||
          w.description.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort by most recent first
    workflows.sort((a, b) => {
      const aTime = a.lastExecutedAt?.getTime() || a.createdAt.getTime();
      const bTime = b.lastExecutedAt?.getTime() || b.createdAt.getTime();
      return bTime - aTime;
    });

    // Paginate
    const total = workflows.length;
    const paginated = workflows.slice(offset, offset + limit);

    return Response.json({
      success: true,
      workflows: paginated,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export function registerWorkflow(workflow: {
  id: string;
  name: string;
  description: string;
}): void {
  WORKFLOW_STORE.set(workflow.id, {
    ...workflow,
    state: 'ready',
    createdAt: new Date(),
    executionCount: 0,
  });
}

export function updateWorkflowExecutionTime(workflowId: string): void {
  const workflow = WORKFLOW_STORE.get(workflowId);
  if (workflow) {
    workflow.lastExecutedAt = new Date();
    workflow.executionCount++;
  }
}
