/**
 * Tests for Gmail Message Parser, Sanitizer, and Mailbox Reader
 */

import { describe, it, expect } from 'vitest';
import {
  parseGmailMessage,
  validateMessage,
  GmailMessage,
} from '../../lib/connectors/gmail/message-parser';
import {
  sanitizeEmailContent,
  truncatePreview,
  containsSensitiveData,
  getSanitizationReport,
} from '../../lib/connectors/gmail/sanitizer';
import {
  GmailMailboxReader,
  generatePreviewForApproval,
} from '../../lib/connectors/gmail/mailbox-reader';

// ============================================================================
// Parser Tests
// ============================================================================

describe('Gmail Message Parser', () => {
  it('should parse a simple text message', () => {
    const rawMessage = {
      id: 'msg_001',
      threadId: 'thread_001',
      labelIds: ['INBOX'],
      internalDate: Date.now().toString(),
      payload: {
        mimeType: 'text/plain',
        headers: [
          { name: 'From', value: 'sender@example.com' },
          { name: 'To', value: 'recipient@example.com' },
          { name: 'Subject', value: 'Test Message' },
          { name: 'Date', value: new Date().toUTCString() },
        ],
        body: {
          data: Buffer.from('Hello, this is a test message').toString('base64'),
        },
      },
    };

    const message = parseGmailMessage(rawMessage);

    expect(message.id).toBe('msg_001');
    expect(message.headers.from).toBe('sender@example.com');
    expect(message.headers.subject).toBe('Test Message');
    expect(message.body.text).toContain('test message');
  });

  it('should parse multipart message (text + html)', () => {
    const rawMessage = {
      id: 'msg_002',
      threadId: 'thread_002',
      labelIds: ['INBOX'],
      internalDate: Date.now().toString(),
      payload: {
        mimeType: 'multipart/alternative',
        headers: [
          { name: 'From', value: 'sender@example.com' },
          { name: 'To', value: 'recipient@example.com' },
          { name: 'Subject', value: 'Multipart Message' },
        ],
        parts: [
          {
            mimeType: 'text/plain',
            body: { data: Buffer.from('Plain text version').toString('base64') },
          },
          {
            mimeType: 'text/html',
            body: { data: Buffer.from('<p>HTML version</p>').toString('base64') },
          },
        ],
      },
    };

    const message = parseGmailMessage(rawMessage);

    expect(message.body.text).toContain('Plain text');
    expect(message.body.html).toContain('HTML version');
  });

  it('should parse message with attachments', () => {
    const rawMessage = {
      id: 'msg_003',
      threadId: 'thread_003',
      labelIds: ['INBOX'],
      internalDate: Date.now().toString(),
      payload: {
        mimeType: 'multipart/mixed',
        headers: [
          { name: 'From', value: 'sender@example.com' },
          { name: 'To', value: 'recipient@example.com' },
          { name: 'Subject', value: 'Message with Attachments' },
        ],
        parts: [
          {
            mimeType: 'text/plain',
            body: { data: Buffer.from('Message body').toString('base64') },
          },
          {
            filename: 'document.pdf',
            mimeType: 'application/pdf',
            body: { attachmentId: 'att_001', size: '12345' },
          },
          {
            filename: 'image.jpg',
            mimeType: 'image/jpeg',
            body: { attachmentId: 'att_002', size: '54321' },
          },
        ],
      },
    };

    const message = parseGmailMessage(rawMessage);

    expect(message.attachments).toHaveLength(2);
    expect(message.attachments[0].filename).toBe('document.pdf');
    expect(message.attachments[1].filename).toBe('image.jpg');
  });

  it('should validate complete message', () => {
    const message: GmailMessage = {
      id: 'msg_001',
      threadId: 'thread_001',
      headers: {
        from: 'sender@example.com',
        to: ['recipient@example.com'],
        subject: 'Test',
        date: new Date(),
      },
      body: { text: 'Test', preview: 'Test' },
      attachments: [],
      labels: [],
      isRead: false,
      isSpam: false,
      isTrash: false,
      internalDate: Date.now(),
    };

    const validation = validateMessage(message);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should reject message with missing fields', () => {
    const message: GmailMessage = {
      id: '',
      threadId: 'thread_001',
      headers: {
        from: '',
        to: [],
        subject: '',
        date: new Date(),
      },
      body: { preview: '' },
      attachments: [],
      labels: [],
      isRead: false,
      isSpam: false,
      isTrash: false,
      internalDate: Date.now(),
    };

    const validation = validateMessage(message);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Sanitizer Tests
// ============================================================================

describe('Email Sanitizer', () => {
  it('should redact Bearer tokens', () => {
    const email = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0';
    const sanitized = sanitizeEmailContent(email);

    expect(sanitized).toContain('***REDACTED***');
    expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
  });

  it('should redact API keys', () => {
    const email = 'Your Stripe API key is: STRIPE_TEST_KEY_PLACEHOLDER';
    const sanitized = sanitizeEmailContent(email);

    expect(sanitized).toContain('***REDACTED***');
    expect(sanitized).not.toContain('STRIPE_TEST_KEY');
  });

  it('should redact passwords', () => {
    const email = 'password: MySecurePassword123! and passwd=anotherpass123';
    const sanitized = sanitizeEmailContent(email);

    expect(sanitized).toContain('***REDACTED***');
    expect(sanitized).not.toContain('MySecurePassword123');
    expect(sanitized).not.toContain('anotherpass123');
  });

  it('should redact URL credentials', () => {
    const email = 'Connect to https://user:password@database.example.com/db';
    const sanitized = sanitizeEmailContent(email);

    expect(sanitized).toContain('***REDACTED***');
    expect(sanitized).not.toContain('user:password');
  });

  it('should truncate long content', () => {
    const longEmail = 'This is a very long email that should be truncated. '.repeat(20);
    const sanitized = sanitizeEmailContent(longEmail, { truncateLength: 100 });

    expect(sanitized.length).toBeLessThanOrEqual(103); // 100 + "..."
    expect(sanitized).toContain('...');
  });

  it('should detect sensitive data patterns', () => {
    const email =
      'Bearer token123456789012345678901234567890 and api_key=API_TEST_KEY_PLACEHOLDER';
    const result = containsSensitiveData(email);

    expect(result.contains).toBe(true);
    expect(result.patterns.length).toBeGreaterThan(0);
  });

  it('should generate sanitization report', () => {
    const original = 'Authorization: Bearer abc123def456ghi789jkl';
    const sanitized = sanitizeEmailContent(original);

    const report = getSanitizationReport(original, sanitized);

    expect(report.original_length).toBe(original.length);
    expect(report.sanitized_length).toEqual(sanitized.length);
    expect(report.redacted_count).toBeGreaterThan(0);
  });

  it('should preserve normal text', () => {
    const email = 'This is a normal email without any sensitive information.';
    const sanitized = sanitizeEmailContent(email);

    expect(sanitized).toBe(email);
  });

  it('should handle Gmail tokens', () => {
    const email = 'Your Gmail token: ghp_1234567890abcdefghijklmnopqrstuvwxyz';
    const sanitized = sanitizeEmailContent(email);

    expect(sanitized).toContain('***REDACTED***');
    expect(sanitized).not.toContain('ghp_');
  });

  it('should redact credit card numbers', () => {
    const email = 'Card: 4111-1111-1111-1111';
    const sanitized = sanitizeEmailContent(email);

    expect(sanitized).toContain('****-****-****-****');
    expect(sanitized).not.toContain('4111');
  });
});

// ============================================================================
// Mailbox Reader Tests
// ============================================================================

describe('Gmail Mailbox Reader', () => {
  it('should initialize with config', () => {
    const reader = new GmailMailboxReader({
      accessToken: 'test_token',
      maxMessages: 10,
      includeBody: true,
    });

    expect(reader).toBeDefined();
  });

  it('should throw error without access token', () => {
    expect(() => {
      new GmailMailboxReader({
        accessToken: '',
        maxMessages: 10,
        includeBody: true,
      });
    }).toThrow();
  });

  it('should read messages from mailbox', async () => {
    const reader = new GmailMailboxReader({
      accessToken: 'test_token',
      maxMessages: 10,
      includeBody: true,
    });

    const result = await reader.readMessages();

    expect(result.messages).toBeDefined();
    expect(Array.isArray(result.messages)).toBe(true);
    expect(result.total).toBeDefined();
  });

  it('should respect maxMessages limit', async () => {
    const reader = new GmailMailboxReader({
      accessToken: 'test_token',
      maxMessages: 3,
      includeBody: true,
    });

    const result = await reader.readMessages();

    expect(result.messages.length).toBeLessThanOrEqual(3);
  });

  it('should read single message', async () => {
    const reader = new GmailMailboxReader({
      accessToken: 'test_token',
      maxMessages: 10,
      includeBody: true,
    });

    const message = await reader.readMessage('msg_001');

    expect(message).toBeDefined();
    expect(message.id).toBe('msg_001');
    expect(message.headers.from).toBeDefined();
  });

  it('should get available labels', async () => {
    const reader = new GmailMailboxReader({
      accessToken: 'test_token',
      maxMessages: 10,
      includeBody: true,
    });

    const labels = await reader.getLabels();

    expect(Array.isArray(labels)).toBe(true);
    expect(labels.length).toBeGreaterThan(0);
  });

  it('should generate safe preview for approval', async () => {
    const reader = new GmailMailboxReader({
      accessToken: 'test_token',
      maxMessages: 10,
      includeBody: true,
    });

    const result = await reader.readMessages();
    const message = result.messages[0];

    const preview = generatePreviewForApproval(message);

    expect(preview).toBeDefined();
    expect(preview.id).toBe(message.id);
    expect(preview.from).toBeDefined();
    expect(preview.subject).toBeDefined();
    expect(preview.snippet).toBeDefined();
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Gmail Reader Integration', () => {
  it('should parse, sanitize, and preview message', async () => {
    const reader = new GmailMailboxReader({
      accessToken: 'test_token',
      maxMessages: 1,
      includeBody: true,
    });

    const result = await reader.readMessages();
    const message = result.messages[0];

    // Verify message structure
    expect(message.id).toBeDefined();
    expect(message.headers.from).toBeDefined();

    // Generate preview
    const preview = generatePreviewForApproval(message);

    // Verify preview is safe
    expect(preview.snippet).toBeDefined();
    expect(preview.snippet.length).toBeGreaterThan(0);
    expect(preview.hasSensitiveData).toBeDefined();
  });

  it('should handle message with sensitive data safely', async () => {
    const rawMessage = {
      id: 'msg_secret',
      threadId: 'thread_secret',
      labelIds: ['INBOX'],
      internalDate: Date.now().toString(),
      payload: {
        mimeType: 'text/plain',
        headers: [
          { name: 'From', value: 'sender@example.com' },
          { name: 'To', value: 'recipient@example.com' },
          { name: 'Subject', value: 'Sensitive Data' },
          { name: 'Date', value: new Date().toUTCString() },
        ],
        body: {
          data: Buffer.from(
            'Your API key: API_TEST_KEY_PLACEHOLDER and password: SecurePass123
          ).toString('base64'),
        },
      },
    };

    const parsed = parseGmailMessage(rawMessage);
    const preview = generatePreviewForApproval(parsed);

    // Verify sensitive data is redacted
    expect(preview.hasSensitiveData).toBe(true);
    expect(preview.snippet).not.toContain('API_TEST_KEY');
    expect(preview.snippet).not.toContain('SecurePass123');
    expect(preview.snippet).toContain('***REDACTED***');
  });

  it('should process multiple messages safely', async () => {
    const reader = new GmailMailboxReader({
      accessToken: 'test_token',
      maxMessages: 3,
      includeBody: true,
    });

    const result = await reader.readMessages();

    // Process all messages
    const previews = result.messages.map((msg) => generatePreviewForApproval(msg));

    expect(previews.length).toBeLessThanOrEqual(3);
    previews.forEach((preview) => {
      expect(preview.id).toBeDefined();
      expect(preview.from).toBeDefined();
      expect(preview.subject).toBeDefined();
    });
  });
});
