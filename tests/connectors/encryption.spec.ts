/**
 * Unit Tests: Encryption Utilities
 */

import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, hash } from '../../lib/connectors/utils/encryption';

describe('Encryption Utilities', () => {
  it('should encrypt and decrypt a string', () => {
    const original = 'secret-token-12345';
    const encrypted = encrypt(original);

    expect(encrypted).not.toBe(original);
    expect(encrypted).toContain(':'); // Format: iv:encrypted

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should produce different encrypted output for same input', () => {
    const text = 'same-token';
    const encrypted1 = encrypt(text);
    const encrypted2 = encrypt(text);

    expect(encrypted1).not.toBe(encrypted2); // Different IVs
    expect(decrypt(encrypted1)).toBe(text);
    expect(decrypt(encrypted2)).toBe(text);
  });

  it('should hash consistently', () => {
    const text = 'test-text';
    const hash1 = hash(text);
    const hash2 = hash(text);

    expect(hash1).toBe(hash2);
  });

  it('should reject malformed encrypted text', () => {
    expect(() => decrypt('invalid-format')).toThrow();
  });

  it('should handle long strings', () => {
    const longString = 'x'.repeat(1000);
    const encrypted = encrypt(longString);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(longString);
  });

  it('should handle special characters', () => {
    const specialText = 'token_with-special.chars!@#$%^&*()';
    const encrypted = encrypt(specialText);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(specialText);
  });
});
