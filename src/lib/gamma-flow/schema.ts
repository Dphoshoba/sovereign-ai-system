/**
 * Gamma Flow Workflow Schema
 * 
 * JSON Schema for validating workflow definitions
 */

export const WorkflowDefinitionSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Gamma Flow Workflow Definition',
  description: 'Schema for orchestrating multi-connector workflows',
  type: 'object',
  required: ['id', 'name', 'description', 'version', 'trigger', 'steps', 'edges', 'creator', 'createdAt'],
  
  properties: {
    id: {
      type: 'string',
      pattern: '^wf_[a-z0-9_]+$',
      description: 'Unique workflow identifier',
    },
    
    name: {
      type: 'string',
      minLength: 3,
      maxLength: 100,
      description: 'Workflow display name',
    },
    
    description: {
      type: 'string',
      minLength: 10,
      maxLength: 500,
      description: 'Detailed workflow description',
    },
    
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+$',
      description: 'Semantic version',
    },
    
    trigger: {
      type: 'object',
      required: ['id', 'type'],
      properties: {
        id: { type: 'string', pattern: '^trigger_[a-z0-9_]+$' },
        type: { type: 'string', enum: ['manual', 'scheduled', 'connector_event', 'webhook', 'form_submission'] },
        connectorName: { type: 'string' },
        eventType: { type: 'string' },
        schedule: { type: 'string', description: 'Cron format' },
        description: { type: 'string' },
      },
    },
    
    steps: {
      type: 'array',
      minItems: 2,
      items: {
        type: 'object',
        required: ['id', 'type', 'name'],
        properties: {
          id: { type: 'string', pattern: '^step_[a-z0-9_]+$' },
          type: { type: 'string', enum: ['trigger', 'connector', 'decision', 'transform', 'approval', 'queue', 'delay', 'notification', 'sink'] },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string' },
          
          connectorName: { type: 'string' },
          actionId: { type: 'string' },
          
          condition: { type: 'object', description: 'For decision nodes' },
          transform: { type: 'object', description: 'For transform nodes' },
          
          approverId: { type: 'string' },
          approvalRequired: { type: 'boolean' },
          approvalTimeout: { type: 'number', minimum: 0 },
          
          delayMs: { type: 'number', minimum: 0 },
          
          inputMapping: { type: 'object' },
          outputVariable: { type: 'string' },
          
          runInPreview: { type: 'boolean', default: true },
          requiresApproval: { type: 'boolean', default: false },
          requiresQueue: { type: 'boolean', default: false },
          riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
          
          metadata: { type: 'object' },
        },
      },
    },
    
    edges: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['id', 'from', 'to', 'type'],
        properties: {
          id: { type: 'string', pattern: '^edge_[a-z0-9_]+$' },
          from: { type: 'string' },
          to: { type: 'string' },
          type: { type: 'string', enum: ['always', 'success', 'failure', 'approved', 'rejected', 'condition_true', 'condition_false'] },
          condition: { type: 'object' },
          metadata: { type: 'object' },
        },
      },
    },
    
    creator: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    tags: { type: 'array', items: { type: 'string' } },
    
    requiresApprovalAtStart: { type: 'boolean' },
    requiresApprovalBeforeExecution: { type: 'boolean' },
    maxRetries: { type: 'number', minimum: 0, maximum: 10 },
    timeoutMs: { type: 'number', minimum: 1000 },
    
    previewMode: { type: 'boolean', default: true },
    enableAudit: { type: 'boolean', default: true },
    enableNotifications: { type: 'boolean', default: false },
    
    metadata: { type: 'object' },
  },
  
  additionalProperties: false,
};

export function validateWorkflowDefinition(definition: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  // Type checks
  if (typeof definition !== 'object' || definition === null) {
    return { valid: false, errors: ['Definition must be an object'] };
  }
  
  if (!definition.id || typeof definition.id !== 'string') {
    errors.push('Missing or invalid id');
  }
  
  if (!definition.name || typeof definition.name !== 'string') {
    errors.push('Missing or invalid name');
  }
  
  if (!Array.isArray(definition.steps) || definition.steps.length < 2) {
    errors.push('Workflow must have at least 2 steps');
  }
  
  if (!Array.isArray(definition.edges) || definition.edges.length < 1) {
    errors.push('Workflow must have at least 1 edge');
  }
  
  if (!definition.trigger) {
    errors.push('Missing trigger');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
