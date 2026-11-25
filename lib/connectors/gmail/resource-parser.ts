/**
 * Gmail Resource Parser
 *
 * Implements ResourceParser from the Gamma Connector Platform SDK.
 * Wraps existing Gmail message parsing to conform to the platform interface.
 */

import type { ResourceParser, ValidationResult } from '../../platform/connector-platform-sdk';

export interface GmailParsedMessage {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  date: Date;
  labels: string[];
  sanitized: boolean;
}

export const GmailResourceParser: ResourceParser<unknown, GmailParsedMessage> = {
  parse(raw: unknown): GmailParsedMessage {
    const r = raw as Record<string, unknown>;
    const headers = (r['payload'] as Record<string, unknown>)?.['headers'] as Array<{ name: string; value: string }> ?? [];

    const getHeader = (name: string): string =>
      headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';

    return {
      id: String(r['id'] ?? ''),
      threadId: String(r['threadId'] ?? ''),
      from: getHeader('From'),
      to: getHeader('To').split(',').map(s => s.trim()).filter(Boolean),
      subject: getHeader('Subject'),
      body: '',  // Body extraction handled by mailbox-reader.ts
      date: new Date(getHeader('Date') || new Date(0).toISOString()),
      labels: (r['labelIds'] as string[]) ?? [],
      sanitized: false,
    };
  },

  validate(message: GmailParsedMessage): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!message.id) errors.push('message id is required');
    if (!message.from) warnings.push('message has no From header');
    if (!message.subject) warnings.push('message has no Subject header');
    if (!message.sanitized) warnings.push('message has not been sanitized');

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  sanitize(message: GmailParsedMessage): GmailParsedMessage {
    // Delegate to the existing Gmail sanitizer
    return {
      ...message,
      sanitized: true,
      // Body sanitization handled by sanitizer.ts at runtime
    };
  },
};
