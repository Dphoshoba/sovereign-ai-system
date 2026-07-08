/**
 * Encryption/Decryption Utilities
 * Secure token storage for connectors
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-dev-key-change-in-production-please-do-it-now';

/**
 * Normalize encryption key to exactly 32 bytes (256 bits) for AES-256
 */
function getNormalizedKey(): Buffer {
  const hash = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  return hash.slice(0, 32); // AES-256 requires 32 bytes
}

/**
 * Encrypt sensitive data (tokens, secrets)
 */
export function encrypt(text: string): string {
  const key = getNormalizedKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  // Return IV + encrypted data (IV doesn't need to be secret)
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  const key = getNormalizedKey();
  const [ivHex, encrypted] = encryptedText.split(':');

  if (!ivHex || !encrypted) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');

  return decrypted;
}

/**
 * Hash a value (one-way, for comparison)
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}
