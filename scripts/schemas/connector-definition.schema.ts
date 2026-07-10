// scripts/schemas/connector-definition.schema.ts
// JSON Schema for connector definitions

export const ConnectorDefinitionSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Gamma Connector Definition",
  description: "Schema for autonomous connector generation",
  type: "object",
  required: ["id", "name", "service", "baseUrl", "authentication", "resources", "actions"],
  
  properties: {
    id: {
      type: "string",
      pattern: "^[a-z0-9-]+$",
      description: "Unique connector identifier (lowercase, hyphens only)",
    },
    
    name: {
      type: "string",
      minLength: 2,
      maxLength: 50,
      description: "Display name of connector",
    },
    
    description: {
      type: "string",
      maxLength: 500,
      description: "Connector description",
    },
    
    service: {
      type: "string",
      description: "Service name (e.g., 'Slack', 'Google Drive')",
    },
    
    version: {
      type: "string",
      pattern: "^\\d+\\.\\d+\\.\\d+$",
      default: "1.0.0",
      description: "Semantic version",
    },
    
    baseUrl: {
      type: "string",
      format: "uri",
      description: "API base URL",
    },
    
    authentication: {
      type: "object",
      required: ["type"],
      properties: {
        type: {
          type: "string",
          enum: ["oauth2", "api_key", "bearer", "basic"],
          description: "Authentication method",
        },
        scopes: {
          type: "array",
          items: { type: "string" },
          description: "OAuth scopes required",
        },
        tokenExpiry: {
          type: "number",
          description: "Token expiry in seconds",
        },
      },
    },
    
    resources: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["id", "name", "endpoint"],
        properties: {
          id: {
            type: "string",
            pattern: "^[a-z0-9_]+$",
          },
          name: {
            type: "string",
          },
          description: {
            type: "string",
          },
          endpoint: {
            type: "string",
            description: "API endpoint path",
          },
          fields: {
            type: "object",
            additionalProperties: { type: "string" },
            description: "Resource field definitions (name: type)",
          },
        },
      },
    },
    
    actions: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["id", "name"],
        properties: {
          id: {
            type: "string",
            pattern: "^[a-z0-9_]+$",
          },
          name: {
            type: "string",
          },
          description: {
            type: "string",
          },
          methods: {
            type: "array",
            items: { type: "string", enum: ["GET", "POST", "PATCH", "DELETE", "PUT"] },
            default: ["GET"],
          },
          riskLevel: {
            type: "string",
            enum: ["low", "medium", "high"],
            default: "medium",
          },
          requiresApproval: {
            type: "boolean",
            default: false,
          },
          featureFlag: {
            type: "string",
            pattern: "^[A-Z_]+$",
            description: "Optional feature flag name (e.g., ENABLE_SLACK_WRITE)",
          },
        },
      },
    },
    
    quotas: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "limit", "window"],
        properties: {
          name: {
            type: "string",
          },
          limit: {
            type: "number",
          },
          window: {
            type: "string",
            enum: ["hour", "day", "month"],
          },
          action: {
            type: "string",
            description: "Action ID this quota applies to",
          },
        },
      },
    },
    
    rateLimit: {
      type: "object",
      properties: {
        normal: { type: "number", minimum: 0, maximum: 100 },
        elevated: { type: "number", minimum: 0, maximum: 100 },
        warning: { type: "number", minimum: 0, maximum: 100 },
        limited: { type: "number", minimum: 0, maximum: 100 },
      },
      default: { normal: 70, elevated: 85, warning: 95, limited: 100 },
    },
    
    compliance: {
      type: "object",
      properties: {
        requiresApproval: { type: "boolean", default: true },
        auditTrail: { type: "boolean", default: true },
        dataEncryption: { type: "boolean", default: true },
        ipWhitelist: { type: "boolean", default: false },
      },
    },
    
    hardening: {
      type: "object",
      properties: {
        tokenMasking: { type: "boolean", default: true },
        expiryThreshold: { type: "number", default: 600, description: "Token expiry warning (seconds)" },
        validateTLS: { type: "boolean", default: true },
        rateLimitHeaders: { type: "boolean", default: true },
      },
    },
    
    metadata: {
      type: "object",
      properties: {
        tags: { type: "array", items: { type: "string" } },
        category: { type: "string" },
        provider: { type: "string" },
        support: { type: "string", enum: ["community", "premium", "enterprise"] },
        icon: { type: "string" },
      },
    },
  },

  additionalProperties: false,
};

// Validate definition
export function validateConnectorDefinition(definition: any): { valid: boolean; errors?: string[] } {
  const Ajv = require("ajv");
  const ajv = new Ajv();
  const validate = ajv.compile(ConnectorDefinitionSchema);
  
  const valid = validate(definition);
  
  if (!valid) {
    return { valid: false, errors: validate.errors?.map((e: any) => `${e.instancePath} ${e.message}`) };
  }
  
  return { valid: true };
}

// Type definitions
export interface ConnectorDefinition {
  id: string;
  name: string;
  description?: string;
  service: string;
  version: string;
  baseUrl: string;
  
  authentication: {
    type: "oauth2" | "api_key" | "bearer" | "basic";
    scopes?: string[];
    tokenExpiry?: number;
  };
  
  resources: Array<{
    id: string;
    name: string;
    description?: string;
    endpoint: string;
    fields?: Record<string, string>;
  }>;
  
  actions: Array<{
    id: string;
    name: string;
    description?: string;
    methods: string[];
    riskLevel: "low" | "medium" | "high";
    requiresApproval: boolean;
    featureFlag?: string;
  }>;
  
  quotas?: Array<{
    name: string;
    limit: number;
    window: "hour" | "day" | "month";
    action?: string;
  }>;
  
  rateLimit?: {
    normal: number;
    elevated: number;
    warning: number;
    limited: number;
  };
  
  compliance?: {
    requiresApproval: boolean;
    auditTrail: boolean;
    dataEncryption: boolean;
    ipWhitelist: boolean;
  };
  
  hardening?: {
    tokenMasking: boolean;
    expiryThreshold: number;
    validateTLS: boolean;
    rateLimitHeaders: boolean;
  };
  
  metadata?: {
    tags: string[];
    category: string;
    provider: string;
    support: "community" | "premium" | "enterprise";
    icon: string;
  };
}
