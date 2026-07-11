import type {
  ResourceParser,
  ValidationResult,
} from "../../platform/connector-platform-sdk";

export interface DropboxResource {
  id: string;
  name: string;
  resourceType: "file" | "folder" | "shared-link" | "team-folder";
  pathLower?: string;
  sizeBytes?: number;
  modifiedAt: Date;
}

function parseResourceType(value: unknown): DropboxResource["resourceType"] {
  if (value === "folder" || value === "shared-link" || value === "team-folder") {
    return value;
  }
  return "file";
}

export const DropboxParser: ResourceParser<unknown, DropboxResource> = {
  parse(raw: unknown): DropboxResource {
    const record = raw as Record<string, unknown>;
    return {
      id: String(record["id"] ?? record["url"] ?? ""),
      name: String(record["name"] ?? ""),
      resourceType: parseResourceType(record["resourceType"] ?? record[".tag"]),
      pathLower:
        typeof record["path_lower"] === "string" ? record["path_lower"] : undefined,
      sizeBytes: typeof record["size"] === "number" ? record["size"] : undefined,
      modifiedAt: new Date(
        String(record["server_modified"] ?? "1970-01-01T00:00:00.000Z")
      ),
    };
  },
  validate(resource: DropboxResource): ValidationResult {
    const errors: string[] = [];
    if (!resource.id) errors.push("id is required");
    if (!resource.name) errors.push("name is required");
    if (Number.isNaN(resource.modifiedAt.getTime())) {
      errors.push("modifiedAt must be a valid date");
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  },
  sanitize(resource: DropboxResource): DropboxResource {
    return {
      ...resource,
      name: resource.name.replace(/sl\.[A-Za-z0-9_-]+/g, "sl.[redacted]"),
      pathLower: resource.pathLower?.replace(/\/tokens?\/[^/]+/g, "/tokens/[redacted]"),
    };
  },
};
