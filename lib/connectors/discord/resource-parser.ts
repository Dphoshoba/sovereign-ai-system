import type {
  ResourceParser,
  ValidationResult,
} from "../../platform/connector-platform-sdk";

export interface DiscordResource {
  id: string;
  name: string;
  resourceType: "guild" | "channel" | "message" | "webhook";
  createdAt: Date;
}

function parseResourceType(value: unknown): DiscordResource["resourceType"] {
  if (value === "channel" || value === "message" || value === "webhook") {
    return value;
  }
  return "guild";
}

export const DiscordParser: ResourceParser<unknown, DiscordResource> = {
  parse(raw: unknown): DiscordResource {
    const record = raw as Record<string, unknown>;
    return {
      id: String(record["id"] ?? ""),
      name: String(record["name"] ?? record["content"] ?? ""),
      resourceType: parseResourceType(record["resourceType"] ?? record["type"]),
      createdAt: new Date(String(record["created_at"] ?? "1970-01-01T00:00:00.000Z")),
    };
  },
  validate(resource: DiscordResource): ValidationResult {
    const errors: string[] = [];
    if (!resource.id) errors.push("id is required");
    if (!resource.name) errors.push("name is required");
    if (Number.isNaN(resource.createdAt.getTime())) {
      errors.push("createdAt must be a valid date");
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  },
  sanitize(resource: DiscordResource): DiscordResource {
    return {
      ...resource,
      name: resource.name.replace(/(bot|token)=\S+/gi, "$1=[redacted]"),
    };
  },
};
