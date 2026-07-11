import type {
  ResourceParser,
  ValidationResult,
} from "../../platform/connector-platform-sdk";

export interface GitHubResource {
  id: string;
  name: string;
  resourceType: "repository" | "issue" | "pull-request" | "workflow";
  url: string;
  createdAt: Date;
}

function parseResourceType(value: unknown): GitHubResource["resourceType"] {
  if (value === "issue" || value === "pull-request" || value === "workflow") {
    return value;
  }
  return "repository";
}

export const GitHubParser: ResourceParser<unknown, GitHubResource> = {
  parse(raw: unknown): GitHubResource {
    const record = raw as Record<string, unknown>;
    return {
      id: String(record["id"] ?? ""),
      name: String(record["name"] ?? record["title"] ?? ""),
      resourceType: parseResourceType(record["resourceType"]),
      url: String(record["html_url"] ?? record["url"] ?? ""),
      createdAt: new Date(String(record["created_at"] ?? "1970-01-01T00:00:00.000Z")),
    };
  },
  validate(resource: GitHubResource): ValidationResult {
    const errors: string[] = [];
    if (!resource.id) errors.push("id is required");
    if (!resource.name) errors.push("name is required");
    if (!resource.url) errors.push("url is required");
    if (Number.isNaN(resource.createdAt.getTime())) {
      errors.push("createdAt must be a valid date");
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  },
  sanitize(resource: GitHubResource): GitHubResource {
    return {
      ...resource,
      url: resource.url.replace(/access_token=[^&]+/i, "access_token=[redacted]"),
    };
  },
};
