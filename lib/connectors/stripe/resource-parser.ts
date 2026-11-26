import type {
  ResourceParser,
  ValidationResult,
} from "../../platform/connector-platform-sdk";

export interface StripeResource {
  id: string;
  name: string;
  resourceType: "customer" | "invoice" | "payment-intent" | "subscription";
  amountCents?: number;
  createdAt: Date;
}

function parseResourceType(value: unknown): StripeResource["resourceType"] {
  if (value === "invoice" || value === "payment-intent" || value === "subscription") {
    return value;
  }
  return "customer";
}

export const StripeParser: ResourceParser<unknown, StripeResource> = {
  parse(raw: unknown): StripeResource {
    const record = raw as Record<string, unknown>;
    return {
      id: String(record["id"] ?? ""),
      name: String(record["name"] ?? record["description"] ?? ""),
      resourceType: parseResourceType(record["resourceType"] ?? record["object"]),
      amountCents:
        typeof record["amount"] === "number" ? record["amount"] : undefined,
      createdAt: new Date(String(record["created_at"] ?? "1970-01-01T00:00:00.000Z")),
    };
  },
  validate(resource: StripeResource): ValidationResult {
    const errors: string[] = [];
    if (!resource.id) errors.push("id is required");
    if (!resource.name) errors.push("name is required");
    if (Number.isNaN(resource.createdAt.getTime())) {
      errors.push("createdAt must be a valid date");
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  },
  sanitize(resource: StripeResource): StripeResource {
    return {
      ...resource,
      name: resource.name.replace(/sk_(live|test)_[A-Za-z0-9]+/g, "sk_$1_[redacted]"),
    };
  },
};
