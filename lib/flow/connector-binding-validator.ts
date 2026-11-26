/**
 * Connector Binding Validator
 * 
 * Validates that all connectors and actions exist in the registry
 */

import type { WorkflowDefinition, ValidationError, ValidationWarning } from '../../src/lib/gamma-flow/types';

// Placeholder registry - in production, would query from the connector platform
const REGISTERED_CONNECTORS = new Set(['gmail', 'slack', 'github', 'notion', 'drive']);

const CONNECTOR_ACTIONS: Record<string, Set<string>> = {
  gmail: new Set(['read_message', 'create_draft', 'send', 'search']),
  slack: new Set(['send_message', 'post_to_channel', 'list_messages']),
  github: new Set(['create_issue', 'comment', 'list_repos']),
  notion: new Set(['create_page', 'update_page', 'query_database']),
  drive: new Set(['upload', 'download', 'list_files']),
};

export interface ConnectorValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  coverage: number; // 0-100
}

export function validateConnectorBindings(definition: WorkflowDefinition): ConnectorValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const connectorSteps = definition.steps.filter(
    (s: any) => s.type === 'connector' && s.connectorName && s.actionId
  );

  if (connectorSteps.length === 0) {
    warnings.push({
      code: 'NO_CONNECTORS',
      message: 'Workflow has no connector steps',
    });
  }

  for (const step of connectorSteps) {
    if (!REGISTERED_CONNECTORS.has(step.connectorName!)) {
      errors.push({
        code: 'UNKNOWN_CONNECTOR',
        message: `Connector '${step.connectorName}' not found in registry`,
        location: step.id,
        severity: 'critical',
      });
      continue;
    }

    const actions = CONNECTOR_ACTIONS[step.connectorName!];
    if (!actions || !actions.has(step.actionId!)) {
      errors.push({
        code: 'UNKNOWN_ACTION',
        message: `Action '${step.actionId}' not found in connector '${step.connectorName}'`,
        location: step.id,
        severity: 'critical',
      });
    }
  }

  const coverage =
    connectorSteps.length > 0
      ? Math.round(
          ((connectorSteps.length - errors.filter(e => e.location).length) /
            connectorSteps.length) *
            100
        )
      : 0;

  return { errors, warnings, coverage };
}
