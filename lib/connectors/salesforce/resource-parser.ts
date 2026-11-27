import type {
  ResourceParser,
  ValidationResult,
} from "../../platform/connector-platform-sdk";

export interface SalesforceResource {
  id: string;
  name: string;
  resourceType: "account" | "contact" | "opportunity" | "case";
  stageName?: string;
  amountCents?: number;
  createdAt: Date;
}

function parseResourceType(value: unknown): SalesforceResource["resourceType"] {
  if (value === "contact" || value === "opportunity" || value === "case") {
    return value;
  }
  return "account";
}

function parseAmountCents(value: unknown): number | undefined {
  if (typeof value === "number") return Math.round(value * 100);
  return undefined;
}

export const SalesforceParser: ResourceParser<unknown, SalesforceResource> = {
  parse(raw: unknown): SalesforceResource {
    const record = raw as Record<string, unknown>;
    return {
      id: String(record["Id"] ?? record["id"] ?? ""),
      name: String(record["Name"] ?? record["name"] ?? ""),
      resourceType: parseResourceType(record["resourceType"] ?? record["type"]),
      stageName:
        typeof record["StageName"] === "string" ? record["StageName"] : undefined,
      amountCents: parseAmountCents(record["Amount"]),
      createdAt: new Date(
        String(record["CreatedDate"] ?? "1970-01-01T00:00:00.000Z")
      ),
    };
  },
  validate(resource: SalesforceResource): ValidationResult {
    const errors: string[] = [];
    if (!resource.id) errors.push("id is required");
    if (!resource.name) errors.push("name is required");
    if (Number.isNaN(resource.createdAt.getTime())) {
      errors.push("createdAt must be a valid date");
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  },
  sanitize(resource: SalesforceResource): SalesforceResource {
    return {
      ...resource,
      name: resource.name.replace(/[A-Z0-9]{18}/g, "[salesforce-id-redacted]"),
    };
  },
};
