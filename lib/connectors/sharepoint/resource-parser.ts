import type {
  ResourceParser,
  ValidationResult,
} from "../../platform/connector-platform-sdk";

export interface SharePointResource {
  id: string;
  name: string;
  resourceType: "site" | "list" | "list-item" | "document-library";
  webUrl?: string;
  itemCount?: number;
  modifiedAt: Date;
}

function parseResourceType(value: unknown): SharePointResource["resourceType"] {
  if (value === "list" || value === "list-item" || value === "document-library") {
    return value;
  }
  return "site";
}

export const SharePointParser: ResourceParser<unknown, SharePointResource> = {
  parse(raw: unknown): SharePointResource {
    const record = raw as Record<string, unknown>;
    return {
      id: String(record["id"] ?? ""),
      name: String(record["name"] ?? record["displayName"] ?? ""),
      resourceType: parseResourceType(record["resourceType"] ?? record["type"]),
      webUrl: typeof record["webUrl"] === "string" ? record["webUrl"] : undefined,
      itemCount: typeof record["itemCount"] === "number" ? record["itemCount"] : undefined,
      modifiedAt: new Date(
        String(record["lastModifiedDateTime"] ?? "1970-01-01T00:00:00.000Z")
      ),
    };
  },
  validate(resource: SharePointResource): ValidationResult {
    const errors: string[] = [];
    if (!resource.id) errors.push("id is required");
    if (!resource.name) errors.push("name is required");
    if (Number.isNaN(resource.modifiedAt.getTime())) {
      errors.push("modifiedAt must be a valid date");
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  },
  sanitize(resource: SharePointResource): SharePointResource {
    return {
      ...resource,
      name: resource.name.replace(/spo[a-z0-9-]{16,}/gi, "spo_[redacted]"),
      webUrl: resource.webUrl?.replace(/e=[A-Za-z0-9]+/g, "e=[redacted]"),
    };
  },
};
