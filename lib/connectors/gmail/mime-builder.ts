/**
 * MIME Email Builder
 * Generates RFC 5321/5322 compliant MIME messages
 */

import { DraftRequest, MimePayload, MimeStructure } from '../../../src/lib/gmail-drafts/types';

export class MimeBuilder {
  private boundary: string;

  constructor() {
    this.boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Build complete MIME payload from draft request
   */
  buildMime(
    request: DraftRequest,
    senderEmail: string
  ): MimePayload {
    const headers = this.buildHeaders(request, senderEmail);
    const { body, structure } = this.buildBody(request);
    const mimeString = this.assembleMimeString(headers, body);

    return {
      mimeString,
      mimeBase64: Buffer.from(mimeString).toString('base64'),
      headers,
      bodyPreview: this.extractPreview(request),
      structure,
    };
  }

  /**
   * Build RFC 5322 headers
   */
  private buildHeaders(request: DraftRequest, senderEmail: string): Record<string, string> {
    const headers: Record<string, string> = {
      From: senderEmail,
      To: request.to.join(', '),
      Subject: this.encodeSubject(request.subject),
      'MIME-Version': '1.0',
      Date: new Date().toUTCString(),
      'X-Mailer': 'Echoes-Visions-Draft-Composer/1.0',
    };

    if (request.cc && request.cc.length > 0) {
      headers['Cc'] = request.cc.join(', ');
    }

    if (request.bcc && request.bcc.length > 0) {
      headers['Bcc'] = request.bcc.join(', ');
    }

    if (request.inReplyTo) {
      headers['In-Reply-To'] = request.inReplyTo;
    }

    if (request.references) {
      headers['References'] = request.references.join(' ');
    }

    // Content-Type depends on body structure
    const hasAttachments = request.attachments && request.attachments.length > 0;
    const hasHtml = !!request.html;
    const hasText = !!request.text;

    if (hasAttachments) {
      headers['Content-Type'] = `multipart/mixed; boundary="${this.boundary}"`;
    } else if (hasHtml && hasText) {
      headers['Content-Type'] = `multipart/alternative; boundary="${this.boundary}"`;
    } else if (hasHtml) {
      headers['Content-Type'] = 'text/html; charset="UTF-8"';
    } else {
      headers['Content-Type'] = 'text/plain; charset="UTF-8"';
    }

    // Add custom headers
    if (request.customHeaders) {
      Object.assign(headers, request.customHeaders);
    }

    return headers;
  }

  /**
   * Build message body with proper MIME structure
   */
  private buildBody(request: DraftRequest): { body: string; structure: MimeStructure } {
    const hasAttachments = request.attachments && request.attachments.length > 0;
    const hasHtml = !!request.html;
    const hasText = !!request.text;

    let body = '';
    let structure: MimeStructure;

    if (hasAttachments) {
      // Multipart with attachments
      const content = this.buildMultipartContent(request);
      body = content;
      structure = {
        type: 'multipart/mixed',
        size: content.length,
        parts: [
          {
            type: 'multipart/alternative',
            parts: [
              ...(hasText ? [{ type: 'text/plain' as const, size: request.text!.length }] : []),
              ...(hasHtml ? [{ type: 'text/html' as const, size: request.html!.length }] : []),
            ],
            size: (request.text?.length || 0) + (request.html?.length || 0),
          },
          ...((request.attachments || []).map(att => ({
            type: att.mimeType as any,
            size: att.size,
          }))),
        ],
      };
    } else if (hasHtml && hasText) {
      // Multipart alternative (text + html)
      body = this.buildMultipartAlternative(request.text!, request.html!);
      structure = {
        type: 'multipart/alternative',
        size: body.length,
        parts: [
          { type: 'text/plain', charset: 'UTF-8', size: request.text!.length },
          { type: 'text/html', charset: 'UTF-8', size: request.html!.length },
        ],
      };
    } else if (hasHtml) {
      // HTML only
      body = request.html!;
      structure = {
        type: 'text/html',
        charset: 'UTF-8',
        size: body.length,
      };
    } else {
      // Plain text only
      body = request.text!;
      structure = {
        type: 'text/plain',
        charset: 'UTF-8',
        size: body.length,
      };
    }

    return { body, structure };
  }

  /**
   * Build multipart/alternative section (text + html)
   */
  private buildMultipartAlternative(text: string, html: string): string {
    const altBoundary = `alt_boundary_${Date.now()}`;

    return `--${altBoundary}
Content-Type: text/plain; charset="UTF-8"
Content-Transfer-Encoding: 7bit

${text}

--${altBoundary}
Content-Type: text/html; charset="UTF-8"
Content-Transfer-Encoding: quoted-printable

${this.escapeHtml(html)}

--${altBoundary}--`;
  }

  /**
   * Build multipart content with attachments
   */
  private buildMultipartContent(request: DraftRequest): string {
    let content = '';

    // Add text/html parts
    content += `--${this.boundary}\n`;
    content += 'Content-Type: multipart/alternative; charset="UTF-8"\n\n';

    if (request.text) {
      content += `--${this.boundary}\n`;
      content += 'Content-Type: text/plain; charset="UTF-8"\n';
      content += 'Content-Transfer-Encoding: 7bit\n\n';
      content += request.text + '\n\n';
    }

    if (request.html) {
      content += `--${this.boundary}\n`;
      content += 'Content-Type: text/html; charset="UTF-8"\n';
      content += 'Content-Transfer-Encoding: quoted-printable\n\n';
      content += this.escapeHtml(request.html) + '\n\n';
    }

    // Add attachments as metadata references
    if (request.attachments) {
      for (const attachment of request.attachments) {
        content += `--${this.boundary}\n`;
        content += `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"\n`;
        content += `Content-Disposition: ${attachment.isInline ? 'inline' : 'attachment'}; filename="${attachment.filename}"\n`;

        if (attachment.contentId) {
          content += `Content-ID: <${attachment.contentId}>\n`;
        }

        content += `Content-Transfer-Encoding: base64\n`;
        content += `X-Attachment-Size: ${attachment.size}\n`;
        content += 'X-Attachment-Note: Attachment metadata only - no actual data\n\n';
        content += '[Binary attachment not included in preview]\n\n';
      }
    }

    content += `--${this.boundary}--`;
    return content;
  }

  /**
   * Assemble final MIME string
   */
  private assembleMimeString(
    headers: Record<string, string>,
    body: string
  ): string {
    let mime = '';

    // Add headers
    for (const [key, value] of Object.entries(headers)) {
      mime += `${key}: ${value}\n`;
    }

    mime += '\n' + body;

    return mime;
  }

  /**
   * Extract text preview from request
   */
  private extractPreview(request: DraftRequest): string {
    let preview = request.html || request.text || '';

    // Remove HTML tags
    preview = preview
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Truncate to 200 characters
    if (preview.length > 200) {
      preview = preview.substring(0, 197) + '...';
    }

    return preview;
  }

  /**
   * Encode subject line (RFC 2047)
   */
  private encodeSubject(subject: string): string {
    if (/^[\x20-\x7E]*$/.test(subject)) {
      // ASCII only - no encoding needed
      return subject;
    }

    // UTF-8 encode with =?UTF-8?B?...?= format
    const encoded = Buffer.from(subject, 'utf-8').toString('base64');
    return `=?UTF-8?B?${encoded}?=`;
  }

  /**
   * Escape HTML for quoted-printable encoding
   */
  private escapeHtml(html: string): string {
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Calculate MIME payload size
   */
  calculateSize(mimePayload: MimePayload): number {
    return Buffer.byteLength(mimePayload.mimeString, 'utf-8');
  }
}

/**
 * Helper function to create MIME builder
 */
export function createMimeBuilder(): MimeBuilder {
  return new MimeBuilder();
}
