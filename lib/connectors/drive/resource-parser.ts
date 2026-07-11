import type {
  ResourceParser,
  ValidationResult,
} from "../../platform/connector-platform-sdk";

export interface DriveResource {
  id: string;
  name: string;
  mimeType: string;
  createdAt: Date;
  owners: string[];
}

export const DriveParser: ResourceParser<unknown, DriveResource> = {
  parse(raw: unknown): DriveResource {
    const record = raw as Record<string, unknown>;
    const owners = Array.isArray(record["owners"])
      ? record["owners"].map(String)
      : [];

    return {
      id: String(record["id"] ?? ""),
      name: String(record["name"] ?? ""),
      mimeType: String(record["mimeType"] ?? "application/octet-stream"),
      createdAt: new Date(String(record["createdTime"] ?? "1970-01-01T00:00:00.000Z")),
      owners,
    };
  },
  validate(resource: DriveResource): ValidationResult {
    const errors: string[] = [];
    if (!resource.id) errors.push("id is required");
    if (!resource.name) errors.push("name is required");
    if (!resource.mimeType) errors.push("mimeType is required");
    if (Number.isNaN(resource.createdAt.getTime())) {
      errors.push("createdAt must be a valid date");
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  },
  sanitize(resource: DriveResource): DriveResource {
    return {
      ...resource,
      owners: resource.owners.map((owner) =>
        owner.includes("@") ? owner.replace(/^(.).+(@.+)$/, "$1***$2") : owner
      ),
    };
  },
};
