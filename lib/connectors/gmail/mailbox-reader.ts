/**
 * Gmail Mailbox Reader
 * 
 * Orchestrates reading messages from Gmail mailbox.
 * Handles filtering, pagination, and safe preview generation.
 */

import {
  GmailMessage,
  parseGmailMessage,
  validateMessage,
} from './message-parser';
import { sanitizeEmailContent, containsSensitiveData } from './sanitizer';

export interface MailboxReaderConfig {
  accessToken: string;
  maxMessages: number;
  includeBody: boolean;
  labels?: string[];
  query?: string;
  pageToken?: string;
}

export interface MailboxReadResult {
  messages: GmailMessage[];
  total: number;
  nextPageToken?: string;
  pageToken?: string;
}

export interface ReadMessageOptions {
  includeBody: boolean;
  sanitize: boolean;
}

/**
 * Mock Gmail API client for testing
 * In production, replace with @google-cloud/gmail or googleapis
 */
class MockGmailApiClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    if (!accessToken) {
      throw new Error('Access token required');
    }
  }

  async listMessages(query: string, pageToken?: string): Promise<any> {
    // Mock response structure matching Gmail API
    return {
      messages: [
        {
          id: 'msg_001',
          threadId: 'thread_001',
        },
        {
          id: 'msg_002',
          threadId: 'thread_002',
        },
        {
          id: 'msg_003',
          threadId: 'thread_003',
        },
      ],
      resultSizeEstimate: 3,
      nextPageToken: null,
    };
  }

  async getMessage(messageId: string, format: string = 'full'): Promise<any> {
    // Mock message responses for testing
    const mockMessages: Record<string, any> = {
      msg_001: {
        id: 'msg_001',
        threadId: 'thread_001',
        labelIds: ['INBOX', 'IMPORTANT'],
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
            data: Buffer.from('This is a test message').toString('base64'),
          },
        },
      },
      msg_002: {
        id: 'msg_002',
        threadId: 'thread_002',
        labelIds: ['INBOX'],
        internalDate: Date.now().toString(),
        payload: {
          mimeType: 'multipart/alternative',
          headers: [
            { name: 'From', value: 'other@example.com' },
            { name: 'To', value: 'recipient@example.com' },
            { name: 'Subject', value: 'Another Message' },
            { name: 'Date', value: new Date().toUTCString() },
          ],
          parts: [
            {
              mimeType: 'text/plain',
              body: { data: Buffer.from('Plain text content').toString('base64') },
            },
            {
              mimeType: 'text/html',
              body: { data: Buffer.from('<p>HTML content</p>').toString('base64') },
            },
          ],
        },
      },
      msg_003: {
        id: 'msg_003',
        threadId: 'thread_003',
        labelIds: ['SENT'],
        internalDate: Date.now().toString(),
        payload: {
          mimeType: 'text/plain',
          headers: [
            { name: 'From', value: 'user@example.com' },
            { name: 'To', value: 'recipient@example.com' },
            { name: 'Subject', value: 'Sent Message' },
            { name: 'Date', value: new Date().toUTCString() },
          ],
          body: {
            data: Buffer.from('This is a sent message').toString('base64'),
          },
        },
      },
    };

    return mockMessages[messageId] || null;
  }

  async getLabels(): Promise<string[]> {
    return ['INBOX', 'SENT', 'DRAFTS', 'SPAM', 'TRASH', 'IMPORTANT', 'STARRED'];
  }
}

/**
 * Gmail Mailbox Reader - orchestrates reading operations
 */
export class GmailMailboxReader {
  private config: MailboxReaderConfig;
  private client: MockGmailApiClient;

  constructor(config: MailboxReaderConfig) {
    this.config = {
      ...{
        maxMessages: 10,
        includeBody: true,
        labels: [],
      },
      ...config,
    };

    this.client = new MockGmailApiClient(this.config.accessToken);
  }

  /**
   * Read messages from mailbox
   */
  async readMessages(): Promise<MailboxReadResult> {
    try {
      // Build query from labels and custom query
      const query = this.buildQuery(this.config.labels, this.config.query);

      // List message IDs
      const listResponse = await this.client.listMessages(query, this.config.pageToken);

      if (!listResponse.messages || listResponse.messages.length === 0) {
        return {
          messages: [],
          total: 0,
          nextPageToken: undefined,
        };
      }

      // Get full messages (up to maxMessages)
      const messages: GmailMessage[] = [];
      const idsToFetch = listResponse.messages.slice(0, this.config.maxMessages);

      for (const item of idsToFetch) {
        try {
          const fullMessage = await this.client.getMessage(
            item.id,
            this.config.includeBody ? 'full' : 'metadata'
          );

          if (fullMessage) {
            const parsed = parseGmailMessage(fullMessage);
            const validation = validateMessage(parsed);

            if (validation.valid) {
              messages.push(parsed);
            } else {
              console.warn(`Invalid message ${item.id}:`, validation.errors);
            }
          }
        } catch (error) {
          console.error(`Failed to fetch message ${item.id}:`, error);
        }
      }

      return {
        messages,
        total: listResponse.resultSizeEstimate || messages.length,
        nextPageToken: listResponse.nextPageToken,
      };
    } catch (error) {
      throw new Error(`Failed to read messages: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Read a single message
   */
  async readMessage(messageId: string): Promise<GmailMessage> {
    try {
      const fullMessage = await this.client.getMessage(messageId, 'full');

      if (!fullMessage) {
        throw new Error(`Message ${messageId} not found`);
      }

      const parsed = parseGmailMessage(fullMessage);
      const validation = validateMessage(parsed);

      if (!validation.valid) {
        throw new Error(`Invalid message: ${validation.errors.join(', ')}`);
      }

      return parsed;
    } catch (error) {
      throw new Error(`Failed to read message ${messageId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get available labels
   */
  async getLabels(): Promise<string[]> {
    return this.client.getLabels();
  }

  /**
   * Build Gmail API query from filters
   */
  private buildQuery(labels?: string[], customQuery?: string): string {
    const queryParts: string[] = [];

    if (labels && labels.length > 0) {
      const labelQuery = labels.map(label => `label:${label}`).join(' OR ');
      queryParts.push(`(${labelQuery})`);
    }

    if (customQuery) {
      queryParts.push(customQuery);
    }

    return queryParts.join(' ');
  }
}

/**
 * Generate safe preview for approval workflow
 */
export interface MessagePreviewForApproval {
  id: string;
  from: string;
  to: string[];
  subject: string;
  snippet: string;
  timestamp: Date;
  attachments: number;
  hasSensitiveData: boolean;
}

export function generatePreviewForApproval(
  message: GmailMessage,
  sanitizationConfig?: any
): MessagePreviewForApproval {
  const fullContent = message.body.html || message.body.text || '';
  const sanitized = sanitizeEmailContent(fullContent, sanitizationConfig);
  const sensitivityCheck = containsSensitiveData(message.body.html || message.body.text || '');

  return {
    id: message.id,
    from: message.headers.from,
    to: message.headers.to,
    subject: message.headers.subject,
    snippet: sanitized,
    timestamp: message.headers.date,
    attachments: message.attachments.length,
    hasSensitiveData: sensitivityCheck.contains,
  };
}
