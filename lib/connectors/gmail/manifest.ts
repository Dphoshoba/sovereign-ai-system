/**
 * Gmail Connector - Manifest
 * Metadata and configuration for Gmail integration
 */

import { ConnectorManifest } from '../sdk/connector-types';

export const gmailManifest: ConnectorManifest = {
  key: 'gmail',
  name: 'Gmail',
  provider: 'google',
  category: 'email',
  description: 'Connect to Gmail to read, draft, and send emails',
  authType: 'oauth2',
  oauthConfig: {
    clientId: process.env.GMAIL_CLIENT_ID || '',
    clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
  },
  actions: {
    read_messages: {
      name: 'read_messages',
      displayName: 'Read Messages',
      description: 'List and read messages from your Gmail mailbox',
      riskLevel: 'low',
      requiresApproval: false,
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Gmail search query (e.g., "from:user@example.com")',
          },
          maxResults: {
            type: 'integer',
            description: 'Maximum number of messages to return (default: 10)',
            default: 10,
          },
          pageToken: {
            type: 'string',
            description: 'Pagination token for next page',
          },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          messages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                threadId: { type: 'string' },
                from: { type: 'string' },
                to: { type: 'string' },
                subject: { type: 'string' },
                body: { type: 'string' },
                date: { type: 'string' },
              },
            },
          },
          resultSizeEstimate: { type: 'integer' },
          nextPageToken: { type: 'string' },
        },
      },
    },
    send_email: {
      name: 'send_email',
      displayName: 'Send Email',
      description: 'Send an email via Gmail (REQUIRES HUMAN APPROVAL)',
      riskLevel: 'high',
      requiresApproval: true,
      inputSchema: {
        type: 'object',
        properties: {
          to: {
            type: 'string',
            description: 'Recipient email address',
          },
          cc: {
            type: 'string',
            description: 'CC recipients (comma-separated)',
          },
          bcc: {
            type: 'string',
            description: 'BCC recipients (comma-separated)',
          },
          subject: {
            type: 'string',
            description: 'Email subject',
          },
          body: {
            type: 'string',
            description: 'Email body (HTML or plain text)',
          },
        },
        required: ['to', 'subject', 'body'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          messageId: { type: 'string' },
          threadId: { type: 'string' },
          labelIds: { type: 'array' },
        },
      },
    },
    draft_email: {
      name: 'draft_email',
      displayName: 'Draft Email',
      description: 'Create a draft email (not sent)',
      riskLevel: 'low',
      requiresApproval: false,
      inputSchema: {
        type: 'object',
        properties: {
          to: {
            type: 'string',
            description: 'Recipient email address',
          },
          cc: {
            type: 'string',
            description: 'CC recipients (comma-separated)',
          },
          bcc: {
            type: 'string',
            description: 'BCC recipients (comma-separated)',
          },
          subject: {
            type: 'string',
            description: 'Email subject',
          },
          body: {
            type: 'string',
            description: 'Email body (HTML or plain text)',
          },
        },
        required: ['to', 'subject', 'body'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          draftId: { type: 'string' },
          messageId: { type: 'string' },
        },
      },
    },
  },
};

/**
 * Validate Gmail manifest configuration
 */
export function validateGmailManifest(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!gmailManifest.oauthConfig?.clientId) {
    errors.push('GMAIL_CLIENT_ID environment variable not set');
  }

  if (!gmailManifest.oauthConfig?.clientSecret) {
    errors.push('GMAIL_CLIENT_SECRET environment variable not set');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
