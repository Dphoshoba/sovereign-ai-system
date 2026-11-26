import type {
  ResourceParser,
  ValidationResult,
} from "../../platform/connector-platform-sdk";

export interface Microsoft365Resource {
  id: string;
  name: string;
  resourceType: "mail" | "file" | "site" | "team";
  webUrl: string;
  createdAt: Date;
}

function parseResourceType(value: unknown): Microsoft365Resource["resourceType"] {
  if (value === "file" || value === "site" || value === "team") return value;
  return "mail";
}

export const Microsoft365Parser: ResourceParser<unknown, Microsoft365Resource> = {
  parse(raw: unknown): Microsoft365Resource {
    const record = raw as Record<string, unknown>;
    return {
      id: String(record["id"] ?? ""),
      name: String(record["name"] ?? record["subject"] ?? ""),
      resourceType: parseResourceType(record["resourceType"]),
      webUrl: String(record["webUrl"] ?? record["web_url"] ?? ""),
      createdAt: new Date(String(record["createdDateTime"] ?? "1970-01-01T00:00:00.000Z")),
    };
  },
  validate(resource: Microsoft365Resource): ValidationResult {
    const errors: string[] = [];
    if (!resource.id) errors.push("id is required");
    if (!resource.name) errors.push("name is required");
    if (!resource.webUrl) errors.push("webUrl is required");
    if (Number.isNaN(resource.createdAt.getTime())) {
      errors.push("createdAt must be a valid date");
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  },
  sanitize(resource: Microsoft365Resource): Microsoft365Resource {
    return {
      ...resource,
      webUrl: resource.webUrl.replace(/access_token=[^&]+/i, "access_token=[redacted]"),
    };
  },
};
