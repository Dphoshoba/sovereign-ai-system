/**
 * Flow Registry Reader - GAMMA Integration
 * 
 * Deterministic reader for workflow definitions stored in GAMMA
 * Provides immutable access to workflow templates and configurations
 */

import type { WorkflowDefinition } from '../../src/lib/gamma-flow/types';

export interface FlowRegistryEntry {
  id: string;
  name: string;
  version: string;
  definition: WorkflowDefinition;
  description: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isPublic: boolean;
  usage: number;
}

// In-memory registry for demonstration
// In production, this would connect to GAMMA_OS/Sovereign AI persistent storage
const FLOW_REGISTRY = new Map<string, FlowRegistryEntry>();

const BASE_TIME = new Date('2026-07-10T12:00:00Z');

// Initialize with template workflows
export function initializeFlowRegistry(): void {
  // Gmail Triage Template
  FLOW_REGISTRY.set('gmail_triage_v1', {
    id: 'gmail_triage_v1',
    name: 'Gmail Triage',
    version: '1.0.0',
    author: 'system',
    description: 'Automatically triage incoming emails into categories and create follow-up tasks',
    createdAt: new Date(BASE_TIME.getTime()),
    updatedAt: new Date(BASE_TIME.getTime()),
    tags: ['email', 'automation', 'productivity'],
    isPublic: true,
    usage: 0,
    definition: {
      id: 'wf_gmail_triage',
      name: 'Gmail Triage Workflow',
      version: '1.0.0',
      creator: 'system',
      createdAt: new Date(BASE_TIME.getTime()),
      updatedAt: new Date(BASE_TIME.getTime()),
      description: 'Triage emails and create tasks',
      trigger: {
        id: 'trigger_1',
        type: 'connector_event',
        connectorName: 'gmail',
        eventType: 'new_message',
      },
      steps: [
        {
          id: 'read_email',
          name: 'Read Email',
          type: 'connector',
          connectorName: 'gmail',
          actionId: 'read_message',
          requiresApproval: false,
        },
        {
          id: 'categorize',
          name: 'Categorize',
          type: 'decision',
          requiresApproval: false,
        },
        {
          id: 'create_task',
          name: 'Create Task',
          type: 'connector',
          connectorName: 'github',
          actionId: 'create_issue',
          requiresApproval: false,
        },
        {
          id: 'approval_gate',
          name: 'Approval Gate',
          type: 'approval',
          requiresApproval: true,
        },
        {
          id: 'queue_execution',
          name: 'Queue Execution',
          type: 'queue',
          requiresApproval: false,
        },
        {
          id: 'complete',
          name: 'Complete',
          type: 'sink',
          requiresApproval: false,
        },
      ],
      edges: [
        { id: 'e1', from: 'trigger_1', to: 'read_email', type: 'always' },
        { id: 'e2', from: 'read_email', to: 'categorize', type: 'success' },
        { id: 'e3', from: 'categorize', to: 'create_task', type: 'condition_true' },
        { id: 'e4', from: 'create_task', to: 'approval_gate', type: 'success' },
        { id: 'e5', from: 'approval_gate', to: 'queue_execution', type: 'approved' },
        { id: 'e6', from: 'queue_execution', to: 'complete', type: 'always' },
      ],
      enableAudit: true,
      previewMode: true,
    },
  });

  // Gmail to Slack Template
  FLOW_REGISTRY.set('gmail_to_slack_v1', {
    id: 'gmail_to_slack_v1',
    name: 'Gmail to Slack',
    version: '1.0.0',
    author: 'system',
    description: 'Forward important emails to Slack channel with AI summary',
    createdAt: new Date(BASE_TIME.getTime()),
    updatedAt: new Date(BASE_TIME.getTime()),
    tags: ['email', 'slack', 'notification'],
    isPublic: true,
    usage: 0,
    definition: {
      id: 'wf_gmail_to_slack',
      name: 'Gmail to Slack Workflow',
      version: '1.0.0',
      creator: 'system',
      createdAt: new Date(BASE_TIME.getTime()),
      updatedAt: new Date(BASE_TIME.getTime()),
      description: 'Forward emails to Slack',
      trigger: {
        id: 'trigger_2',
        type: 'connector_event',
        connectorName: 'gmail',
        eventType: 'new_message',
      },
      steps: [
        {
          id: 'read_email',
          name: 'Read Email',
          type: 'connector',
          connectorName: 'gmail',
          actionId: 'read_message',
          requiresApproval: false,
        },
        {
          id: 'filter_priority',
          name: 'Filter Priority',
          type: 'decision',
          requiresApproval: false,
        },
        {
          id: 'send_slack',
          name: 'Send to Slack',
          type: 'connector',
          connectorName: 'slack',
          actionId: 'send_message',
          requiresApproval: false,
        },
        {
          id: 'approval_gate',
          name: 'Approval Gate',
          type: 'approval',
          requiresApproval: true,
        },
        {
          id: 'queue_execution',
          name: 'Queue Execution',
          type: 'queue',
          requiresApproval: false,
        },
        {
          id: 'complete',
          name: 'Complete',
          type: 'sink',
          requiresApproval: false,
        },
      ],
      edges: [
        { id: 'e1', from: 'trigger_2', to: 'read_email', type: 'always' },
        { id: 'e2', from: 'read_email', to: 'filter_priority', type: 'success' },
        { id: 'e3', from: 'filter_priority', to: 'send_slack', type: 'condition_true' },
        { id: 'e4', from: 'send_slack', to: 'approval_gate', type: 'success' },
        { id: 'e5', from: 'approval_gate', to: 'queue_execution', type: 'approved' },
        { id: 'e6', from: 'queue_execution', to: 'complete', type: 'always' },
      ],
      enableAudit: true,
      previewMode: true,
    },
  });
}

export class FlowRegistryReader {
  getTemplates(): FlowRegistryEntry[] {
    return Array.from(FLOW_REGISTRY.values());
  }

  getTemplate(id: string): FlowRegistryEntry | undefined {
    return FLOW_REGISTRY.get(id);
  }

  getTemplatesByTag(tag: string): FlowRegistryEntry[] {
    return Array.from(FLOW_REGISTRY.values()).filter(entry => entry.tags.includes(tag));
  }

  registerTemplate(entry: FlowRegistryEntry): void {
    FLOW_REGISTRY.set(entry.id, {
      ...entry,
      createdAt: entry.createdAt || new Date(),
      updatedAt: new Date(),
    });
  }

  updateTemplate(id: string, updates: Partial<FlowRegistryEntry>): void {
    const existing = FLOW_REGISTRY.get(id);
    if (!existing) {
      throw new Error(`Template ${id} not found`);
    }

    FLOW_REGISTRY.set(id, {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    });
  }

  deleteTemplate(id: string): boolean {
    return FLOW_REGISTRY.delete(id);
  }

  search(query: string): FlowRegistryEntry[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(FLOW_REGISTRY.values()).filter(
      entry =>
        entry.name.toLowerCase().includes(lowerQuery) ||
        entry.description.toLowerCase().includes(lowerQuery) ||
        entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Deterministic: Each read returns same output for given template ID
   * Uses BASE_TIME for all timestamps (no runtime variability)
   */
  getTemplateHash(id: string): string {
    const entry = FLOW_REGISTRY.get(id);
    if (!entry) return '';

    // Create deterministic string representation
    const content = JSON.stringify({
      id: entry.id,
      name: entry.name,
      version: entry.version,
      definition: entry.definition,
    });

    // Simple hash (in production would use SHA-256)
    return `hash_${Buffer.from(content).toString('base64').slice(0, 12)}`;
  }
}
