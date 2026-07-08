/**
 * Gmail Connector - Barrel Export
 */

export { gmailManifest, validateGmailManifest } from './manifest';
export { GmailAuthenticator } from './authenticator';
export { GmailConnector } from './executor';
export type { GmailMessage, GmailDraft, GmailSendResult } from './types';
