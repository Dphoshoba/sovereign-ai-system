/**
 * Calendar Resource Parser
 */
import type { ResourceParser, ValidationResult } from '../../platform/connector-platform-sdk';

export interface CalendarResource {
  id: string;
  name: string;
  createdAt: Date;
}

export const CalendarParser: ResourceParser<unknown, CalendarResource> = {
  parse(raw: unknown): CalendarResource {
    const r = raw as Record<string, unknown>;
    return {
      id: String(r['id'] ?? ''),
      name: String(r['name'] ?? ''),
      createdAt: new Date(String(r['created_at'] ?? new Date().toISOString())),
    };
  },
  validate(resource: CalendarResource): ValidationResult {
    const errors: string[] = [];
    if (!resource.id) errors.push('id is required');
    if (!resource.name) errors.push('name is required');
    return { valid: errors.length === 0, errors, warnings: [] };
  },
  sanitize(resource: CalendarResource): CalendarResource {
    return resource;
  },
};
