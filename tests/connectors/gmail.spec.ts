/**
 * Unit Tests: Gmail Connector
 */

import { describe, it, expect } from 'vitest';
import { GmailConnector } from '../../lib/connectors/gmail/executor';
import { gmailManifest } from '../../lib/connectors/gmail/manifest';

describe('GmailConnector', () => {
  const connector = new GmailConnector();

  it('should have Gmail manifest', () => {
    expect(connector.getManifest().key).toBe('gmail');
    expect(connector.getManifest().provider).toBe('google');
  });

  it('should list Gmail actions', () => {
    const actions = connector.getActions();
    expect(actions).toContain('read_messages');
    expect(actions).toContain('send_email');
    expect(actions).toContain('draft_email');
  });

  it('should generate preview for read_messages', async () => {
    const preview = await connector.generatePreview('conn_1', 'read_messages', {
      maxResults: 10,
    });

    expect(preview.action).toBe('read_messages');
    expect(preview.what_will_happen).toContain('read');
    expect(preview.risk_level).toBe('low');
    expect(preview.safety_checks).toContainEqual({ name: 'No data modification', passed: true });
  });

  it('should generate preview for send_email with approval required', async () => {
    const preview = await connector.generatePreview('conn_1', 'send_email', {
      to: 'test@example.com',
      subject: 'Test',
      body: 'Test body',
    });

    expect(preview.action).toBe('send_email');
    expect(preview.risk_level).toBe('high');
    expect(preview.recipients).toEqual(['test@example.com']);
    expect(preview.safety_checks.some(check => check.name === 'No external send before approval')).toBe(true);
  });

  it('should reject invalid email in preview', async () => {
    const preview = await connector.generatePreview('conn_1', 'send_email', {
      to: 'invalid-email',
      subject: 'Test',
      body: 'Test body',
    });

    expect(preview.safety_checks.some(check => check.name === 'Recipient valid' && !check.passed)).toBe(true);
  });

  it('should execute read_messages', async () => {
    const result = await connector.execute('conn_1', 'read_messages', {
      maxResults: 10,
    });

    expect(result.success).toBe(true);
    expect(result.result?.messages).toBeDefined();
  });

  it('should validate send_email parameters', () => {
    // Missing required fields
    const validation1 = connector.validateParams('send_email', { to: 'test@example.com' });
    expect(validation1.valid).toBe(false);

    // All fields provided
    const validation2 = connector.validateParams('send_email', {
      to: 'test@example.com',
      subject: 'Test',
      body: 'Test body',
    });
    expect(validation2.valid).toBe(true);
  });

  it('should have correct OAuth scopes', () => {
    const scopes = gmailManifest.oauthConfig?.scopes || [];
    expect(scopes).toContain('https://www.googleapis.com/auth/gmail.readonly');
    expect(scopes).toContain('https://www.googleapis.com/auth/gmail.compose');
  });

  it('should mark send_email as requiring approval', () => {
    const action = connector.getAction('send_email');
    expect(action?.requiresApproval).toBe(true);
  });

  it('should NOT mark draft_email as requiring approval', () => {
    const action = connector.getAction('draft_email');
    expect(action?.requiresApproval).toBe(false);
  });
});
