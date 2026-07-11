import type {
  ResourceParser,
  ValidationResult,
} from "../../platform/connector-platform-sdk";

export interface OneDriveResource {
  id: string;
  name: string;
  resourceType: "file" | "folder" | "drive" | "shortcut";
  webUrl?: string;
  sizeBytes?: number;
  modifiedAt: Date;
}

function parseResourceType(record: Record<string, unknown>): OneDriveResource["resourceType"] {
  if (record["folder"]) return "folder";
  if (record["remoteItem"]) return "shortcut";
  if (record["driveType"]) return "drive";
  return "file";
}

export const OneDriveParser: ResourceParser<unknown, OneDriveResource> = {
  parse(raw: unknown): OneDriveResource {
    const record = raw as Record<string, unknown>;
    return {
      id: String(record["id"] ?? ""),
      name: String(record["name"] ?? ""),
      resourceType: parseResourceType(record),
      webUrl: typeof record["webUrl"] === "string" ? record["webUrl"] : undefined,
      sizeBytes: typeof record["size"] === "number" ? record["size"] : undefined,
      modifiedAt: new Date(
        String(record["lastModifiedDateTime"] ?? "1970-01-01T00:00:00.000Z")
      ),
    };
  },
  validate(resource: OneDriveResource): ValidationResult {
    const errors: string[] = [];
    if (!resource.id) errors.push("id is required");
    if (!resource.name) errors.push("name is required");
    if (Number.isNaN(resource.modifiedAt.getTime())) {
      errors.push("modifiedAt must be a valid date");
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  },
  sanitize(resource: OneDriveResource): OneDriveResource {
    return {
      ...resource,
      name: resource.name.replace(/eyJ[A-Za-z0-9_-]+/g, "jwt_[redacted]"),
      webUrl: resource.webUrl?.replace(/authkey=[^&]+/g, "authkey=[redacted]"),
    };
  },
};
