/**
 * Email Content Sanitizer
 * 
 * Removes sensitive information from email content:
 * - Authentication tokens (Bearer, API-Key headers)
 * - API keys and secrets
 * - Passwords and credentials
 * - Sensitive patterns
 */

export interface SanitizationConfig {
  redactTokens: boolean;
  redactPasswords: boolean;
  redactEmails: boolean;
  truncateLength: number;
}

export const DEFAULT_SANITIZATION_CONFIG: SanitizationConfig = {
  redactTokens: true,
  redactPasswords: true,
  redactEmails: false,
  truncateLength: 500,
};

/**
 * Main sanitization function - applies all redactions
 */
export function sanitizeEmailContent(
  content: string,
  config: Partial<SanitizationConfig> = {}
): string {
  const finalConfig = { ...DEFAULT_SANITIZATION_CONFIG, ...config };

  let sanitized = content;

  if (finalConfig.redactTokens) {
    sanitized = redactAuthTokens(sanitized);
    sanitized = redactApiKeys(sanitized);
  }

  if (finalConfig.redactPasswords) {
    sanitized = redactPasswords(sanitized);
    sanitized = redactCredentials(sanitized);
  }

  sanitized = truncatePreview(sanitized, finalConfig.truncateLength);

  return sanitized;
}

/**
 * Remove authorization tokens
 * Examples:
 *   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *   Authorization: Bearer token_value
 *   X-API-Token: token_value
 */
function redactAuthTokens(text: string): string {
  let result = text;

  // Bearer tokens
  result = result.replace(/Bearer\s+[\w.-]+/gi, 'Bearer ***REDACTED***');

  // Authorization headers
  result = result.replace(/Authorization:\s*[\w\s.-]+/gi, 'Authorization: ***REDACTED***');

  // API Token headers
  result = result.replace(/(X-API-Token|X-API-Key|X-Auth-Token|Token):\s*[\w.-]+/gi, '$1: ***REDACTED***');

  // JWT tokens (long strings with dots)
  result = result.replace(/eyJ[\w\-\.]+\.eyJ[\w\-\.]+\.[\w\-\.]+/g, 'eyJ***REDACTED***');

  // OAuth tokens
  result = result.replace(/oauth_?token["\']?\s*[:=]\s*["\']?[\w-]+["\']?/gi, 'oauth_token: ***REDACTED***');

  return result;
}

/**
 * Remove API keys and secrets
 * Examples:
 *   api_key: "sk_live_abcdef123456..."
 *   STRIPE_SECRET_KEY=sk_test_...
 *   github_token=ghp_...
 */
function redactApiKeys(text: string): string {
  let result = text;

  // Generic API key pattern (32+ alphanumeric chars)
  result = result.replace(/[\w_]{32,}/g, (match) => {
    // Only redact if looks like key (no common words)
    if (
      !['authorization', 'content', 'connection', 'description'].includes(match.toLowerCase()) &&
      /[a-z0-9]{32,}/i.test(match)
    ) {
      return '***REDACTED***';
    }
    return match;
  });

  // Stripe API keys
  result = result.replace(/(sk_live_|sk_test_|rk_live_|rk_test_)[a-z0-9]+/gi, '$1***REDACTED***');

  // GitHub tokens
  result = result.replace(/(ghp_|gho_|ghu_|ghs_|ghr_)[a-z0-9]+/gi, '$1***REDACTED***');

  // AWS keys
  result = result.replace(/(AKIA|ASIA)[0-9A-Z]{16}/g, '$&(***REDACTED***)');

  // Google API keys
  result = result.replace(/AIza[0-9A-Za-z\-_]{35}/g, 'AIza***REDACTED***');

  // Generic secret patterns
  result = result.replace(/(secret|key|token)\s*[=:]\s*["\']?[\w\-\.]+["\']?/gi, (match) => {
    const eqIndex = match.search(/[=:]/);
    if (eqIndex >= 0) {
      return match.substring(0, eqIndex + 1) + '***REDACTED***';
    }
    return match;
  });

  return result;
}

/**
 * Remove passwords and credentials
 * Examples:
 *   password: "MyPassword123"
 *   passwd=secretpass
 *   pwd: ***
 */
function redactPasswords(text: string): string {
  let result = text;

  // Password fields
  result = result.replace(/(password|passwd|pwd|secret)\s*[=:]\s*["\']?[^"\'\s\n]+["\']?/gi, (match) => {
    const eqIndex = match.search(/[=:]/);
    if (eqIndex >= 0) {
      const prefix = match.substring(0, eqIndex);
      return prefix + '=***REDACTED***';
    }
    return match;
  });

  // Credentials object
  result = result.replace(/(username|user|login)["\']?\s*[=:]\s*["\']?[^"\'\s\n]+["\']?\s+(password|pass)["\']?\s*[=:]\s*["\']?[^"\'\s\n]+["\']?/gi, (match) => {
    return match.replace(/[=:]\s*["\']?[^"\'\s]+["\']?(?=\s+(password|pass))/i, '=***REDACTED***').replace(/password["\']?\s*[=:]\s*["\']?[^"\'\s]+["\']?/i, 'password=***REDACTED***');
  });

  // URL credentials (user:pass@host)
  result = result.replace(/https?:\/\/[^:]+:[^@]+@/gi, 'https://***REDACTED***:***REDACTED***@');

  return result;
}

/**
 * Remove other credentials
 * Examples:
 *   credit_card=4111111111111111
 *   ssn=123-45-6789
 *   database_connection_string
 */
function redactCredentials(text: string): string {
  let result = text;

  // Credit card numbers (simple pattern)
  result = result.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '****-****-****-****');

  // SSN pattern (###-##-####)
  result = result.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '***-**-****');

  // Database connection strings
  result = result.replace(/(database_url|connection_string|db_url)["\']?\s*[=:]\s*[^\s\n]+/gi, (match) => {
    const eqIndex = match.search(/[=:]/);
    if (eqIndex >= 0) {
      const key = match.substring(0, eqIndex);
      return key + '=***REDACTED***';
    }
    return match;
  });

  // Private keys
  result = result.replace(/(private_key|private.?key|rsa.?private|BEGIN RSA PRIVATE KEY)[\s\S]*?(END RSA PRIVATE KEY|-----END)/g, '$1\n***REDACTED***\n$2');

  return result;
}

/**
 * Truncate content to maximum length
 */
export function truncatePreview(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.substring(0, maxLength);

  // Try to cut at word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Check if content contains potential secrets
 */
export function containsSensitiveData(text: string): {
  contains: boolean;
  patterns: string[];
} {
  const patterns: string[] = [];

  // Bearer tokens
  if (/Bearer\s+[\w.-]{20,}/i.test(text)) {
    patterns.push('bearer_token');
  }

  // API keys
  if (/[\w_]{32,}/.test(text)) {
    patterns.push('api_key_pattern');
  }

  // Passwords
  if (/(password|passwd|pwd)\s*[=:]/i.test(text)) {
    patterns.push('password_field');
  }

  // Credit cards
  if (/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(text)) {
    patterns.push('credit_card');
  }

  // URLs with credentials
  if (/https?:\/\/[^:]+:[^@]+@/.test(text)) {
    patterns.push('url_credentials');
  }

  // JWT-like tokens
  if (/eyJ[\w\-\.]+\.eyJ[\w\-\.]+\.[\w\-\.]+/.test(text)) {
    patterns.push('jwt_token');
  }

  return {
    contains: patterns.length > 0,
    patterns,
  };
}

/**
 * Get sanitization report for logging/auditing
 */
export function getSanitizationReport(
  original: string,
  sanitized: string
): {
  original_length: number;
  sanitized_length: number;
  redacted_count: number;
  contained_patterns: string[];
} {
  const originalRedacted = containsSensitiveData(original);
  const redactedCount = (sanitized.match(/\*\*\*REDACTED\*\*\*/g) || []).length;

  return {
    original_length: original.length,
    sanitized_length: sanitized.length,
    redacted_count: redactedCount,
    contained_patterns: originalRedacted.patterns,
  };
}
