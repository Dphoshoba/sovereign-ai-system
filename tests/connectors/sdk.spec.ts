/**
 * Unit Tests: Connector SDK
 */

import { describe, it, expect } from 'vitest';
import { BaseConnector } from '../../lib/connectors/sdk/base-connector';
import {
  ConnectorManifest,
  ExecutionResult,
  PreviewResult,
} from '../../lib/connectors/sdk/connector-types';

// Mock connector for testing
class TestConnector extends BaseConnector {
  async generatePreview(
    connectionId: string,
    actionName: string,
    params: Record<string, any>
  ): Promise<PreviewResult> {
    return {
      action: actionName,
      what_will_happen: 'Test action',
      risk_level: 'low',
      safety_checks: [{ name: 'test', passed: true }],
    };
  }

  async execute(
    connectionId: string,
    actionName: string,
    params: Record<string, any>
  ): Promise<ExecutionResult> {
    return { success: true, result: { test: 'result' } };
  }
}

const testManifest: ConnectorManifest = {
  key: 'test',
  name: 'Test',
  provider: 'test',
  category: 'test',
  authType: 'oauth2',
  actions: {
    test_action: {
      name: 'test_action',
      displayName: 'Test Action',
      riskLevel: 'low',
      requiresApproval: false,
      inputSchema: {
        type: 'object',
        properties: {
          param1: { type: 'string' },
        },
        required: ['param1'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          result: { type: 'string' },
        },
      },
    },
  },
};

describe('BaseConnector', () => {
  const connector = new TestConnector(testManifest);

  it('should get manifest', () => {
    expect(connector.getManifest()).toEqual(testManifest);
  });

  it('should list all actions', () => {
    expect(connector.getActions()).toEqual(['test_action']);
  });

  it('should get action metadata', () => {
    const action = connector.getAction('test_action');
    expect(action).toBeDefined();
    expect(action?.name).toBe('test_action');
  });

  it('should validate required parameters', () => {
    const validation = connector.validateParams('test_action', { param1: 'value' });
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should reject missing required parameters', () => {
    const validation = connector.validateParams('test_action', {});
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Missing required field: param1');
  });

  it('should generate preview', async () => {
    const preview = await connector.generatePreview('conn_1', 'test_action', { param1: 'value' });
    expect(preview.action).toBe('test_action');
    expect(preview.risk_level).toBe('low');
  });

  it('should execute action', async () => {
    const result = await connector.execute('conn_1', 'test_action', { param1: 'value' });
    expect(result.success).toBe(true);
    expect(result.result?.test).toBe('result');
  });

  it('should sanitize sensitive data for logging', () => {
    const data = {
      email: 'test@example.com',
      token: 'secret_token_123',
      apiKey: 'api_key_456',
      nested: {
        password: 'password123',
      },
    };

    const sanitized = (connector as any).sanitizeForLogging(data);

    expect(sanitized.email).toBe('test@example.com');
    expect(sanitized.token).toBe('***REDACTED***');
    expect(sanitized.apiKey).toBe('***REDACTED***');
    expect(sanitized.nested.password).toBe('***REDACTED***');
  });

  it('should reject unknown action', () => {
    const validation = connector.validateParams('unknown_action', {});
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Action unknown_action not found');
  });
});
