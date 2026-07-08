/**
 * Draft API Layer
 * High-level draft operations with simulation/real mode support
 * Part of Build 136: Gmail Draft API Integration
 */

import { GmailApiClient } from './gmail-api';
import { ExecutionEngine } from './execution-engine';
import { ExecutionAuditLog } from './execution-audit';
import {
  GmailDraft,
  DraftReceipt,
  CreateDraftRequest,
  CreateDraftResponse,
  GetDraftResponse,
  ListDraftsResponse,
  DeleteDraftResponse,
} from '../../../src/lib/gmail-api/types';
import {
  MOCK_GMAIL_DRAFT_1,
  MOCK_GMAIL_DRAFT_2,
  BASE_TIME,
} from '../../../src/lib/gmail-api/mock-data';

export interface DraftApiConfig {
  enableRealExecution: boolean;
  accountEmail: string;
}

export class DraftApi {
  private gmailClient: GmailApiClient;
  private executionEngine: ExecutionEngine;
  private auditLog: ExecutionAuditLog;
  private enableRealExecution: boolean;
  private accountEmail: string;
  private draftCache: Map<string, DraftReceipt> = new Map();
  private draftCount = 0;

  constructor(config: DraftApiConfig) {
    this.enableRealExecution = config.enableRealExecution;
    this.accountEmail = config.accountEmail;
    this.gmailClient = new GmailApiClient({ enableRealExecution: this.enableRealExecution });
    this.executionEngine = new ExecutionEngine();
    this.auditLog = new ExecutionAuditLog();
  }

  /**
   * Create a draft in Gmail (real mode) or simulate (simulation mode)
   */
  async createDraft(
    request: CreateDraftRequest,
    executionId: string,
    accessToken: string,
    operator: string,
  ): Promise<CreateDraftResponse> {
    const receiptId = `receipt_${executionId}_${this.draftCount++}`;

    try {
      // Record audit event: create started
      await this.auditLog.recordEvent({
        id: `audit_${Date.now()}`,
        type: 'gmail_draft_create_started',
        executionId,
        draftReceiptId: receiptId,
        operator,
        timestamp: new Date(),
        details: {
          to: request.to,
          cc: request.cc || [],
          bcc: request.bcc || [],
          subject: request.subject,
        },
        readonly: true,
      });

      if (this.enableRealExecution) {
        return this.createDraftReal(request, executionId, receiptId, accessToken, operator);
      } else {
        return this.createDraftSimulated(request, executionId, receiptId, operator);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      await this.auditLog.recordEvent({
        id: `audit_${Date.now()}`,
        type: 'gmail_api_failed',
        executionId,
        draftReceiptId: receiptId,
        operator,
        timestamp: new Date(),
        details: {
          error: errorMessage,
          subject: request.subject,
        },
        readonly: true,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Create draft in real mode (actual Gmail API call)
   */
  private async createDraftReal(
    request: CreateDraftRequest,
    executionId: string,
    receiptId: string,
    accessToken: string,
    operator: string,
  ): Promise<CreateDraftResponse> {
    const startTime = Date.now();

    try {
      // Validate token
      if (!this.gmailClient.validateToken(accessToken)) {
        throw new Error('Invalid access token format');
      }

      // Build MIME message
      const mimeMessage = this.buildMimeMessage(request);

      // Call Gmail API to create draft
      const response = await this.gmailClient.request<{ id: string }>(
        'POST',
        '/users/me/drafts',
        accessToken,
        {
          message: {
            raw: Buffer.from(mimeMessage).toString('base64'),
          },
        },
      );

      const latencyMs = Date.now() - startTime;

      const receipt: DraftReceipt = {
        id: receiptId,
        executionId,
        draftId: executionId,
        gmailDraftId: response.id,
        gmailAccount: this.accountEmail,
        createdTime: new Date(),
        size: mimeMessage.length,
        preview: request.body.substring(0, 100),
        mode: 'real',
        auditId: `audit_${Date.now()}`,
        status: 'created',
      };

      this.draftCache.set(receiptId, receipt);
      this.draftCount++;

      // Record success audit event
      await this.auditLog.recordEvent({
        id: `audit_${Date.now()}`,
        type: 'gmail_draft_created',
        executionId,
        draftReceiptId: receiptId,
        operator,
        timestamp: new Date(),
        details: {
          gmailDraftId: response.id,
          latencyMs,
        },
        readonly: true,
      });

      return {
        success: true,
        receipt,
        gmailDraftId: response.id,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create draft in simulation mode (no API call)
   */
  private async createDraftSimulated(
    request: CreateDraftRequest,
    executionId: string,
    receiptId: string,
    operator: string,
  ): Promise<CreateDraftResponse> {
    // Simulate draft creation with realistic latency
    const simulatedLatency = Math.random() * 200 + 100; // 100-300ms
    await new Promise((resolve) => setTimeout(resolve, simulatedLatency));

    const simulatedDraftId = `msg_sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const receipt: DraftReceipt = {
      id: receiptId,
      executionId,
      draftId: executionId,
      gmailDraftId: undefined, // Not set in simulation
      gmailAccount: this.accountEmail,
      createdTime: new Date(),
      size: request.body.length,
      preview: request.body.substring(0, 100),
      mode: 'simulation',
      auditId: `audit_${Date.now()}`,
      status: 'created',
    };

    this.draftCache.set(receiptId, receipt);
    this.draftCount++;

    // Record simulation audit event
    await this.auditLog.recordEvent({
      id: `audit_${Date.now()}`,
      type: 'gmail_draft_simulated',
      executionId,
      draftReceiptId: receiptId,
      operator,
      timestamp: new Date(),
      details: {
        simulatedDraftId,
        to: request.to,
        subject: request.subject,
        latencyMs: simulatedLatency,
      },
      readonly: true,
    });

    return {
      success: true,
      receipt,
      gmailDraftId: simulatedDraftId,
    };
  }

  /**
   * Get draft by ID
   */
  async getDraft(
    receiptId: string,
    gmailDraftId?: string,
    accessToken?: string,
  ): Promise<GetDraftResponse> {
    try {
      const cachedReceipt = this.draftCache.get(receiptId);
      if (cachedReceipt) {
        return {
          success: true,
          receipt: cachedReceipt,
        };
      }

      if (this.enableRealExecution && gmailDraftId && accessToken) {
        // Would fetch from Gmail API
        const draft = await this.gmailClient.request<GmailDraft>(
          'GET',
          `/users/me/drafts/${gmailDraftId}`,
          accessToken,
        );

        return {
          success: true,
          draft,
        };
      }

      // Return mock for simulation
      return {
        success: true,
        draft: this.draftCount % 2 === 0 ? MOCK_GMAIL_DRAFT_1 : MOCK_GMAIL_DRAFT_2,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * List drafts
   */
  async listDrafts(accessToken?: string): Promise<ListDraftsResponse> {
    try {
      const receipts = Array.from(this.draftCache.values());

      if (this.enableRealExecution && accessToken) {
        // Would fetch from Gmail API
        // For now, return cached receipts
      }

      return {
        success: true,
        receipts,
        totalCount: this.draftCount,
      };
    } catch (error) {
      return {
        success: false,
        receipts: [],
        totalCount: 0,
      };
    }
  }

  /**
   * Delete draft
   */
  async deleteDraft(
    gmailDraftId: string,
    accessToken?: string,
  ): Promise<DeleteDraftResponse> {
    try {
      if (this.enableRealExecution && accessToken) {
        // Call Gmail API
        await this.gmailClient.request(
          'DELETE',
          `/users/me/drafts/${gmailDraftId}`,
          accessToken,
        );
      }

      // Find and remove from cache
      for (const [key, receipt] of this.draftCache.entries()) {
        if (receipt.gmailDraftId === gmailDraftId) {
          this.draftCache.delete(key);

          await this.auditLog.recordEvent({
            id: `audit_${Date.now()}`,
            type: 'gmail_draft_deleted',
            executionId: receipt.executionId,
            draftReceiptId: key,
            operator: 'system',
            timestamp: new Date(),
            details: {
              gmailDraftId,
            },
            readonly: true,
          });

          break;
        }
      }

      return {
        success: true,
        gmailDraftId,
        deleted: true,
      };
    } catch (error) {
      return {
        success: false,
        deleted: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      totalDrafts: this.draftCount,
      cachedDrafts: this.draftCache.size,
      mode: this.enableRealExecution ? 'real' : 'simulation',
    };
  }

  /**
   * Build MIME message from request
   */
  private buildMimeMessage(request: CreateDraftRequest): string {
    const headers = [
      `From: <${this.accountEmail}>`,
      `To: ${request.to.join(', ')}`,
      request.cc && request.cc.length > 0 ? `Cc: ${request.cc.join(', ')}` : '',
      request.bcc && request.bcc.length > 0 ? `Bcc: ${request.bcc.join(', ')}` : '',
      `Subject: ${request.subject}`,
      'MIME-Version: 1.0',
      request.htmlBody
        ? 'Content-Type: text/html; charset="UTF-8"'
        : 'Content-Type: text/plain; charset="UTF-8"',
    ]
      .filter((h) => h.length > 0)
      .join('\r\n');

    const body = request.htmlBody || request.body;
    return `${headers}\r\n\r\n${body}`;
  }
}
