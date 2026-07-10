/**
 * GET /api/flow/templates
 * 
 * Lists workflow templates from GAMMA registry
 */

import { FlowRegistryReader, initializeFlowRegistry } from '../../../../lib/gamma/flow-registry-reader';

// Initialize registry once
initializeFlowRegistry();
const registry = new FlowRegistryReader();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const tag = url.searchParams.get('tag');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let templates;

    if (search) {
      templates = registry.search(search);
    } else if (tag) {
      templates = registry.getTemplatesByTag(tag);
    } else {
      templates = registry.getTemplates();
    }

    // Sort by usage (most popular first)
    templates.sort((a: any, b: any) => b.usage - a.usage);

    // Paginate
    const total = templates.length;
    const paginated = templates.slice(offset, offset + limit).map((t: any) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      version: t.version,
      author: t.author,
      tags: t.tags,
      usage: t.usage,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return Response.json({
      success: true,
      templates: paginated,
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

export async function GET_BY_ID(request: Request, { params }: { params: { id: string } }) {
  try {
    const template = registry.getTemplate(params.id);

    if (!template) {
      return Response.json(
        { error: `Template ${params.id} not found` },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      template: {
        ...template,
        definition: template.definition,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
