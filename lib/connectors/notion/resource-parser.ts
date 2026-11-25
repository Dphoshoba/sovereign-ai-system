import type {
  ResourceParser,
  ValidationResult,
} from "../../platform/connector-platform-sdk";

export interface NotionResource {
  id: string;
  title: string;
  resourceType: "page" | "database" | "block";
  url: string;
  createdAt: Date;
}

function parseResourceType(value: unknown): NotionResource["resourceType"] {
  if (value === "database" || value === "block") return value;
  return "page";
}

export const NotionParser: ResourceParser<unknown, NotionResource> = {
  parse(raw: unknown): NotionResource {
    const record = raw as Record<string, unknown>;
    return {
      id: String(record["id"] ?? ""),
      title: String(record["title"] ?? record["name"] ?? ""),
      resourceType: parseResourceType(record["resourceType"] ?? record["object"]),
      url: String(record["url"] ?? ""),
      createdAt: new Date(String(record["created_time"] ?? "1970-01-01T00:00:00.000Z")),
    };
  },
  validate(resource: NotionResource): ValidationResult {
    const errors: string[] = [];
    if (!resource.id) errors.push("id is required");
    if (!resource.title) errors.push("title is required");
    if (!resource.url) errors.push("url is required");
    if (Number.isNaN(resource.createdAt.getTime())) {
      errors.push("createdAt must be a valid date");
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  },
  sanitize(resource: NotionResource): NotionResource {
    return {
      ...resource,
      url: resource.url.replace(/token=[^&]+/i, "token=[redacted]"),
    };
  },
};
