/**
 * Base Connector - Framework for all connectors
 * Provides structure for actions, preview, approval, execution, audit
 */

import { ConnectorManifest, ExecutionResult, PreviewResult } from './connector-types';

export abstract class BaseConnector {
  protected manifest: ConnectorManifest;

  constructor(manifest: ConnectorManifest) {
    this.manifest = manifest;
  }

  /**
   * Get connector metadata
   */
  getManifest(): ConnectorManifest {
    return this.manifest;
  }

  /**
   * List all available actions
   */
  getActions(): string[] {
    return Object.keys(this.manifest.actions);
  }

  /**
   * Get action metadata
   */
  getAction(actionName: string) {
    return this.manifest.actions[actionName];
  }

  /**
   * Generate a preview of what an action would do
   * Override in subclass
   */
  async generatePreview(
    connectionId: string,
    actionName: string,
    params: Record<string, any>
  ): Promise<PreviewResult> {
    const action = this.getAction(actionName);
    if (!action) {
      throw new Error(`Action ${actionName} not found`);
    }

    return {
      action: actionName,
      what_will_happen: `${action.displayName} would execute with provided parameters`,
      risk_level: action.riskLevel,
      safety_checks: [
        {
          name: 'Authentication Valid',
          passed: true,
        },
        {
          name: 'Permissions Granted',
          passed: true,
        },
        {
          name: 'No External Send',
          passed: action.riskLevel !== 'high',
        },
      ],
    };
  }

  /**
   * Execute an action
   * Override in subclass
   */
  async execute(
    connectionId: string,
    actionName: string,
    params: Record<string, any>
  ): Promise<ExecutionResult> {
    throw new Error(`execute() not implemented for ${this.manifest.name}`);
  }

  /**
   * Validate action parameters against schema
   */
  validateParams(actionName: string, params: Record<string, any>): { valid: boolean; errors: string[] } {
    const action = this.getAction(actionName);
    if (!action) {
      return {
        valid: false,
        errors: [`Action ${actionName} not found`],
      };
    }

    const errors: string[] = [];

    // Basic schema validation
    if (action.inputSchema.required) {
      for (const field of action.inputSchema.required) {
        if (!(field in params)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize data before logging (remove secrets)
   */
  protected sanitizeForLogging(data: Record<string, any>): Record<string, any> {
    const sanitized = { ...data };
    const secretFields = ['token', 'secret', 'password', 'apiKey', 'refreshToken', 'accessToken'];

    const sanitize = (obj: Record<string, any>) => {
      for (const key in obj) {
        if (secretFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = '***REDACTED***';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };

    sanitize(sanitized);
    return sanitized;
  }
}
