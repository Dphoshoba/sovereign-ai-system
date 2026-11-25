/**
 * API Response Helpers
 *
 * Standardized response constructors for all API routes.
 * Eliminates duplicated NextResponse.json() patterns across 521 routes.
 *
 * Usage:
 *   return ok({ data: results });
 *   return notFound('Connector not found');
 *   return serverError(err);
 */

import { NextResponse } from 'next/server';

export type ApiResponseMeta = {
  requestId?: string;
  version?: string;
  cached?: boolean;
};

/** 200 OK */
export function ok<T>(data: T, meta?: ApiResponseMeta): NextResponse {
  return NextResponse.json({ data, status: 'ok', ...meta }, { status: 200 });
}

/** 200 OK — list response with count */
export function list<T>(items: T[], meta?: ApiResponseMeta): NextResponse {
  return NextResponse.json(
    { data: items, count: items.length, status: 'ok', ...meta },
    { status: 200 }
  );
}

/** 201 Created */
export function created<T>(data: T): NextResponse {
  return NextResponse.json({ data, status: 'created' }, { status: 201 });
}

/** 400 Bad Request */
export function badRequest(message: string, details?: unknown): NextResponse {
  return NextResponse.json(
    { error: message, details, status: 'bad_request' },
    { status: 400 }
  );
}

/** 401 Unauthorized */
export function unauthorized(message = 'Authentication required'): NextResponse {
  return NextResponse.json({ error: message, status: 'unauthorized' }, { status: 401 });
}

/** 403 Forbidden */
export function forbidden(message = 'Access denied'): NextResponse {
  return NextResponse.json({ error: message, status: 'forbidden' }, { status: 403 });
}

/** 404 Not Found */
export function notFound(message = 'Not found'): NextResponse {
  return NextResponse.json({ error: message, status: 'not_found' }, { status: 404 });
}

/** 409 Conflict */
export function conflict(message: string): NextResponse {
  return NextResponse.json({ error: message, status: 'conflict' }, { status: 409 });
}

/** 422 Unprocessable Entity */
export function validationError(errors: string[]): NextResponse {
  return NextResponse.json(
    { error: 'Validation failed', errors, status: 'validation_error' },
    { status: 422 }
  );
}

/** 429 Too Many Requests */
export function rateLimited(retryAfterSeconds?: number): NextResponse {
  const headers: Record<string, string> = {};
  if (retryAfterSeconds) headers['Retry-After'] = String(retryAfterSeconds);
  return NextResponse.json(
    { error: 'Rate limit exceeded', status: 'rate_limited' },
    { status: 429, headers }
  );
}

/** 500 Internal Server Error */
export function serverError(err: unknown, context?: string): NextResponse {
  const message = err instanceof Error ? err.message : 'Internal server error';
  const safeMessage = context ? `${context}: ${message}` : message;
  return NextResponse.json(
    { error: safeMessage, status: 'server_error' },
    { status: 500 }
  );
}

/** 503 Service Unavailable */
export function serviceUnavailable(reason = 'Service temporarily unavailable'): NextResponse {
  return NextResponse.json({ error: reason, status: 'service_unavailable' }, { status: 503 });
}

/**
 * Cached response — wraps any ok() with cache headers
 */
export function cachedOk<T>(data: T, maxAgeSeconds: number): NextResponse {
  return NextResponse.json(
    { data, status: 'ok', cached: true },
    {
      status: 200,
      headers: { 'Cache-Control': `s-maxage=${maxAgeSeconds}, stale-while-revalidate` },
    }
  );
}

/**
 * Simulation-mode guard
 * Returns 200 with simulation flag when ENABLE_REAL_EXECUTION is false
 */
export function simulationOnly(preview: unknown): NextResponse {
  return NextResponse.json(
    {
      data: preview,
      status: 'simulation',
      note: 'ENABLE_REAL_EXECUTION=false — preview only, no action taken',
    },
    { status: 200 }
  );
}

/**
 * Feature not enabled
 */
export function featureDisabled(featureFlag: string): NextResponse {
  return NextResponse.json(
    {
      error: `Feature '${featureFlag}' is not enabled`,
      status: 'feature_disabled',
    },
    { status: 403 }
  );
}
