import type {
  ResourceParser,
  ValidationResult,
} from "../../platform/connector-platform-sdk";

export interface HubSpotResource {
  id: string;
  name: string;
  resourceType: "contact" | "company" | "deal" | "ticket";
  pipelineStage?: string;
  amountCents?: number;
  createdAt: Date;
}

function parseResourceType(value: unknown): HubSpotResource["resourceType"] {
  if (value === "company" || value === "deal" || value === "ticket") return value;
  return "contact";
}

function propertiesOf(record: Record<string, unknown>): Record<string, unknown> {
  const properties = record["properties"];
  return properties && typeof properties === "object"
    ? (properties as Record<string, unknown>)
    : record;
}

function parseName(properties: Record<string, unknown>): string {
  const explicit = properties["name"] ?? properties["dealname"] ?? properties["subject"];
  if (explicit) return String(explicit);
  return [properties["firstname"], properties["lastname"]].filter(Boolean).join(" ");
}

function parseAmountCents(value: unknown): number | undefined {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : undefined;
}

export const HubSpotParser: ResourceParser<unknown, HubSpotResource> = {
  parse(raw: unknown): HubSpotResource {
    const record = raw as Record<string, unknown>;
    const properties = propertiesOf(record);
    return {
      id: String(record["id"] ?? ""),
      name: parseName(properties),
      resourceType: parseResourceType(record["resourceType"] ?? record["objectType"]),
      pipelineStage:
        typeof properties["dealstage"] === "string"
          ? properties["dealstage"]
          : undefined,
      amountCents: parseAmountCents(properties["amount"]),
      createdAt: new Date(
        String(
          record["createdAt"] ??
            properties["createdate"] ??
            "1970-01-01T00:00:00.000Z"
        )
      ),
    };
  },
  validate(resource: HubSpotResource): ValidationResult {
    const errors: string[] = [];
    if (!resource.id) errors.push("id is required");
    if (!resource.name) errors.push("name is required");
    if (Number.isNaN(resource.createdAt.getTime())) {
      errors.push("createdAt must be a valid date");
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  },
  sanitize(resource: HubSpotResource): HubSpotResource {
    return {
      ...resource,
      name: resource.name.replace(/pat-[A-Za-z0-9-]+/g, "pat-[redacted]"),
    };
  },
};
