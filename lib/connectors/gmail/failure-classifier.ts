/**
 * Failure Classifier
 * 
 * Analyzes execution errors and classifies them into failure categories.
 * Used by resilience manager to determine retry eligibility and action plans.
 */

import type { FailureMetadata, FailureClassification } from '../../../src/lib/gmail-resilience/types';
import { MOCK_FAILURE_CLASSIFICATIONS } from '../../../src/lib/gmail-resilience/mock-data';

export class FailureClassifier {
  /**
   * Classify an error into a failure category
   */
  public classifyError(error: Error | string, context?: Record<string, any>): FailureMetadata {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = context?.errorCode || context?.statusCode;

    // Check for specific error patterns
    if (this.isRateLimited(errorCode, errorMessage)) {
      return MOCK_FAILURE_CLASSIFICATIONS.rate_limited;
    }

    if (this.isAuthExpired(errorCode, errorMessage)) {
      return MOCK_FAILURE_CLASSIFICATIONS.auth_expired;
    }

    if (this.isAuthInvalid(errorCode, errorMessage)) {
      return MOCK_FAILURE_CLASSIFICATIONS.auth_invalid;
    }

    if (this.isPermissionDenied(errorCode, errorMessage)) {
      return MOCK_FAILURE_CLASSIFICATIONS.permission_denied;
    }

    if (this.isQuotaExceeded(errorCode, errorMessage)) {
      return MOCK_FAILURE_CLASSIFICATIONS.quota_exceeded;
    }

    if (this.isValidationError(errorCode, errorMessage)) {
      return MOCK_FAILURE_CLASSIFICATIONS.validation_error;
    }

    if (this.isDuplicateDetected(errorCode, errorMessage, context)) {
      return MOCK_FAILURE_CLASSIFICATIONS.duplicate_detected;
    }

    if (this.isNetworkError(errorCode, errorMessage)) {
      return MOCK_FAILURE_CLASSIFICATIONS.network_error;
    }

    if (this.isGmailUnavailable(errorCode, errorMessage)) {
      return MOCK_FAILURE_CLASSIFICATIONS.gmail_unavailable;
    }

    if (this.isTransient(errorCode, errorMessage)) {
      return MOCK_FAILURE_CLASSIFICATIONS.transient;
    }

    if (this.isPermanentFailure(errorCode, errorMessage)) {
      return MOCK_FAILURE_CLASSIFICATIONS.permanent_failure;
    }

    return MOCK_FAILURE_CLASSIFICATIONS.unknown_failure;
  }

  /**
   * Check if error is rate limited
   */
  private isRateLimited(code: any, message: string): boolean {
    return (
      code === 429 ||
      message.includes('Rate Limit') ||
      message.includes('Too many requests')
    );
  }

  /**
   * Check if error is auth expired
   */
  private isAuthExpired(code: any, message: string): boolean {
    return (
      code === 401 ||
      message.includes('Token expired') ||
      message.includes('Invalid token') ||
      message.includes('Credentials are invalid')
    );
  }

  /**
   * Check if error is auth invalid (cannot refresh)
   */
  private isAuthInvalid(code: any, message: string): boolean {
    return (
      message.includes('Invalid refresh token') ||
      message.includes('Revoked credentials') ||
      message.includes('User revoked access')
    );
  }

  /**
   * Check if error is permission denied
   */
  private isPermissionDenied(code: any, message: string): boolean {
    return (
      code === 403 ||
      message.includes('Permission denied') ||
      message.includes('Insufficient scope')
    );
  }

  /**
   * Check if error is quota exceeded
   */
  private isQuotaExceeded(code: any, message: string): boolean {
    return (
      message.includes('Quota exceeded') ||
      message.includes('Daily limit') ||
      message.includes('Quota limit')
    );
  }

  /**
   * Check if error is validation error
   */
  private isValidationError(code: any, message: string): boolean {
    return (
      code === 400 ||
      message.includes('Invalid') ||
      message.includes('Validation failed') ||
      message.includes('Bad request')
    );
  }

  /**
   * Check if error is duplicate detected
   */
  private isDuplicateDetected(code: any, message: string, context?: Record<string, any>): boolean {
    return context?.isDuplicate === true || message.includes('Duplicate');
  }

  /**
   * Check if error is network error
   */
  private isNetworkError(code: any, message: string): boolean {
    return (
      message.includes('ETIMEDOUT') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ENOTFOUND') ||
      message.includes('Network timeout') ||
      message.includes('Connection refused')
    );
  }

  /**
   * Check if Gmail service is unavailable
   */
  private isGmailUnavailable(code: any, message: string): boolean {
    return (
      code === 503 ||
      code === 502 ||
      message.includes('Service unavailable') ||
      message.includes('Bad Gateway')
    );
  }

  /**
   * Check if error is transient
   */
  private isTransient(code: any, message: string): boolean {
    return (
      code === 500 ||
      code === 504 ||
      message.includes('Internal server error') ||
      message.includes('Temporarily unavailable')
    );
  }

  /**
   * Check if error is permanent failure
   */
  private isPermanentFailure(code: any, message: string): boolean {
    return (
      code === 404 ||
      message.includes('Not found') ||
      message.includes('Gone') ||
      message.includes('Permanently deleted')
    );
  }

  /**
   * Extract error code from HTTP response or error context
   */
  public extractErrorCode(error: Error | string, context?: Record<string, any>): number | undefined {
    if (context?.statusCode) return context.statusCode;
    if (context?.errorCode) return context.errorCode;

    const errorMessage = error instanceof Error ? error.message : String(error);
    const match = errorMessage.match(/\((\d{3})\)/);
    return match ? parseInt(match[1], 10) : undefined;
  }

  /**
   * Get all classifications
   */
  public getAllClassifications(): Record<string, FailureMetadata> {
    return MOCK_FAILURE_CLASSIFICATIONS;
  }
}
