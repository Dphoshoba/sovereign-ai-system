/**
 * Gmail Connector - Main Executor
 * Handles Gmail operations (read, send, draft)
 */

import { BaseConnector, ExecutionResult, PreviewResult } from '../sdk';
import { gmailManifest } from './manifest';
import { GmailMailboxReader, generatePreviewForApproval } from './mailbox-reader';
import { sanitizeEmailContent } from './sanitizer';
import type { ConnectorConnectionData } from '../sdk/connector-types';

export class GmailConnector extends BaseConnector {
  constructor() {
    super(gmailManifest);
  }

  /**
   * Generate a preview of what an action would do
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

    // Validate parameters
    const validation = this.validateParams(actionName, params);
    if (!validation.valid) {
      throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
    }

    // Generate preview based on action
    switch (actionName) {
      case 'read_messages':
        return {
          action: 'read_messages',
          what_will_happen: `Will read up to ${params.maxResults || 10} messages from your Gmail mailbox${params.query ? ` matching: "${params.query}"` : ''}`,
          risk_level: 'low',
          safety_checks: [
            { name: 'No data modification', passed: true },
            { name: 'Read-only operation', passed: true },
            { name: 'No external send', passed: true },
          ],
        };

      case 'send_email':
        return {
          action: 'send_email',
          what_will_happen: `Will send an email to ${params.to}`,
          recipients: [params.to],
          content: `Subject: ${params.subject}`,
          risk_level: 'high',
          safety_checks: [
            { name: 'No external send before approval', passed: false, message: 'Awaiting human approval' },
            { name: 'Recipient valid', passed: this.isValidEmail(params.to) },
            { name: 'Content not empty', passed: !!params.body },
          ],
        };

      case 'draft_email':
        return {
          action: 'draft_email',
          what_will_happen: `Will create a draft email to ${params.to} (not sent)`,
          recipients: [params.to],
          content: `Subject: ${params.subject}`,
          risk_level: 'low',
          safety_checks: [
            { name: 'No send action', passed: true },
            { name: 'Draft only', passed: true },
          ],
        };

      default:
        throw new Error(`Unknown action: ${actionName}`);
    }
  }

  /**
   * Execute an action
   */
  async execute(
    connectionId: string,
    actionName: string,
    params: Record<string, any>
  ): Promise<ExecutionResult> {
    const action = this.getAction(actionName);
    if (!action) {
      return {
        success: false,
        error: `Action ${actionName} not found`,
      };
    }

    // Validate parameters
    const validation = this.validateParams(actionName, params);
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid parameters: ${validation.errors.join(', ')}`,
      };
    }

    // Execute based on action
    switch (actionName) {
      case 'read_messages':
        return this.readMessages(connectionId, params);

      case 'send_email':
        return this.sendEmail(connectionId, params);

      case 'draft_email':
        return this.draftEmail(connectionId, params);

      default:
        return {
          success: false,
          error: `Unknown action: ${actionName}`,
        };
    }
  }

  /**
   * Read messages from Gmail
   */
  private async readMessages(
    connectionId: string,
    params: Record<string, any>
  ): Promise<ExecutionResult> {
    try {
      // Initialize mailbox reader with mock token
      // In real implementation, would use actual decrypted token from connection
      const reader = new GmailMailboxReader({
        accessToken: 'mock_token_for_testing',
        maxMessages: params.limit || 10,
        includeBody: true,
        labels: params.labels,
        query: params.query,
      });

      // Read messages from mailbox
      const result = await reader.readMessages();

      if (result.messages.length === 0) {
        return {
          success: true,
          result: {
            messages: [],
            total: 0,
            message: 'No messages found matching criteria',
          },
        };
      }

      // Generate safe previews for approval
      const previews = result.messages.map((msg) =>
        generatePreviewForApproval(msg, {
          truncateLength: 500,
          redactTokens: true,
          redactPasswords: true,
        })
      );

      return {
        success: true,
        result: {
          messages: previews,
          total: result.total,
          nextPageToken: result.nextPageToken,
          message: `Read ${previews.length} messages`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read messages: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Send an email via Gmail
   */
  private async sendEmail(
    connectionId: string,
    params: Record<string, any>
  ): Promise<ExecutionResult> {
    // This would normally send via Gmail API
    // For Build 131, we're just setting up the structure
    // Real implementation comes in Build 133+

    return {
      success: true,
      result: {
        messageId: 'msg_' + Date.now(),
        threadId: 'thread_' + Date.now(),
        labelIds: ['SENT'],
      },
    };
  }

  /**
   * Create a draft email
   */
  private async draftEmail(
    connectionId: string,
    params: Record<string, any>
  ): Promise<ExecutionResult> {
    // This would normally create draft via Gmail API
    // For Build 131, we're just setting up the structure
    // Real implementation comes in Build 133

    return {
      success: true,
      result: {
        draftId: 'draft_' + Date.now(),
        messageId: 'msg_' + Date.now(),
      },
    };
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
