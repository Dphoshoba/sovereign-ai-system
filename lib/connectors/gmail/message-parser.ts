/**
 * Gmail Message Parser
 * 
 * Parses Gmail API raw message format into structured objects.
 * Handles multipart MIME messages, headers extraction, and attachment detection.
 */

export interface GmailMessageHeaders {
  from: string;
  to: string[];
  subject: string;
  date: Date;
  cc?: string[];
  bcc?: string[];
  messageId?: string;
  inReplyTo?: string;
}

export interface GmailMessageAttachment {
  filename: string;
  mimeType: string;
  size: number;
}

export interface GmailMessageBody {
  text?: string;
  html?: string;
  preview: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  headers: GmailMessageHeaders;
  body: GmailMessageBody;
  attachments: GmailMessageAttachment[];
  labels: string[];
  isRead: boolean;
  isSpam: boolean;
  isTrash: boolean;
  internalDate: number;
}

/**
 * Parse Gmail API raw message into structured object
 */
export function parseGmailMessage(rawMessage: any): GmailMessage {
  if (!rawMessage || !rawMessage.payload) {
    throw new Error('Invalid Gmail message format');
  }

  const payload = rawMessage.payload;
  const headers = getHeaders(payload.headers || []);

  const body = extractBody(payload);
  const attachments = extractAttachments(payload);
  const labels = rawMessage.labelIds || [];

  return {
    id: rawMessage.id,
    threadId: rawMessage.threadId,
    headers: {
      from: headers['from'] || 'unknown',
      to: parseEmailList(headers['to']),
      subject: headers['subject'] || '(no subject)',
      date: new Date(parseInt(rawMessage.internalDate || Date.now())),
      cc: headers['cc'] ? parseEmailList(headers['cc']) : undefined,
      bcc: headers['bcc'] ? parseEmailList(headers['bcc']) : undefined,
      messageId: headers['message-id'],
      inReplyTo: headers['in-reply-to'],
    },
    body,
    attachments,
    labels,
    isRead: !labels.includes('UNREAD'),
    isSpam: labels.includes('SPAM'),
    isTrash: labels.includes('TRASH'),
    internalDate: parseInt(rawMessage.internalDate || '0'),
  };
}

/**
 * Extract headers from Gmail API header array
 */
function getHeaders(headerArray: any[]): Record<string, string> {
  const headers: Record<string, string> = {};

  for (const header of headerArray) {
    if (header.name && header.value) {
      headers[header.name.toLowerCase()] = header.value;
    }
  }

  return headers;
}

/**
 * Parse email address list (comma or semicolon separated)
 */
function parseEmailList(emailString: string): string[] {
  if (!emailString) return [];

  return emailString
    .split(/[,;]/)
    .map(email => email.trim())
    .filter(email => email.length > 0);
}

/**
 * Extract body from Gmail message payload (handles multipart)
 */
function extractBody(payload: any): GmailMessageBody {
  let text = '';
  let html = '';

  if (payload.body?.data) {
    // Single part message
    const mimeType = payload.mimeType || 'text/plain';
    const content = decodeBase64(payload.body.data);

    if (mimeType.includes('text/plain')) {
      text = content;
    } else if (mimeType.includes('text/html')) {
      html = content;
    }
  } else if (payload.parts) {
    // Multipart message - find text and html parts
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text = decodeBase64(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html = decodeBase64(part.body.data);
      }
    }
  }

  const content = html || text;
  const preview = content ? extractPreview(content, 200) : '';

  return {
    text: text || undefined,
    html: html || undefined,
    preview,
  };
}

/**
 * Extract plain text preview from content
 */
function extractPreview(content: string, maxLength: number): string {
  // Remove HTML tags
  let text = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Decode HTML entities
  text = decodeHtmlEntities(text);

  // Truncate
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...';
  }

  return text;
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }

  return result;
}

/**
 * Extract attachments from Gmail message payload
 */
function extractAttachments(payload: any): GmailMessageAttachment[] {
  const attachments: GmailMessageAttachment[] = [];

  const processPart = (part: any) => {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType || 'application/octet-stream',
        size: parseInt(part.body.size || '0'),
      });
    }

    if (part.parts) {
      for (const subPart of part.parts) {
        processPart(subPart);
      }
    }
  };

  if (payload.parts) {
    for (const part of payload.parts) {
      processPart(part);
    }
  }

  return attachments;
}

/**
 * Decode base64 string (Gmail API uses URL-safe base64)
 */
function decodeBase64(data: string): string {
  try {
    // Gmail uses URL-safe base64, convert to standard base64
    const standardBase64 = data
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Add padding if needed
    const padded = standardBase64 + '='.repeat((4 - standardBase64.length % 4) % 4);

    return Buffer.from(padded, 'base64').toString('utf-8');
  } catch (error) {
    console.error('Failed to decode base64:', error);
    return '';
  }
}

/**
 * Validate parsed message has required fields
 */
export function validateMessage(message: GmailMessage): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!message.id) errors.push('Missing message ID');
  if (!message.headers.from) errors.push('Missing from header');
  if (!message.headers.subject) errors.push('Missing subject header');
  if (!message.headers.date) errors.push('Missing date header');

  return {
    valid: errors.length === 0,
    errors,
  };
}
