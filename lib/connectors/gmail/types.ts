/**
 * Gmail Connector - Types
 */

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
}

export interface GmailDraft {
  draftId: string;
  messageId: string;
}

export interface GmailSendResult {
  messageId: string;
  threadId: string;
  labelIds: string[];
}
