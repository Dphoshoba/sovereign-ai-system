import type {
  ApiClient,
  QuotaDefinition,
  RateLimitTier,
} from "../../platform/connector-platform-sdk";

export const NotionClient: ApiClient = {
  serviceName: "Notion",
  baseUrl: "https://api.notion.com/v1",
  rateLimitTiers: [
    { name: "Normal", thresholdPercent: 70, score: 100, backoffSeconds: 0 },
    { name: "Elevated", thresholdPercent: 85, score: 70, backoffSeconds: 10 },
    { name: "Warning", thresholdPercent: 95, score: 40, backoffSeconds: 30 },
    { name: "Limited", thresholdPercent: 100, score: 10, backoffSeconds: 60 },
  ] satisfies RateLimitTier[],
  quotaDefinitions: [
    { name: "content.read", limit: 10000, windowSeconds: 86400 },
    { name: "content.write", limit: 2500, windowSeconds: 86400 },
  ] satisfies QuotaDefinition[],
  async read(_resource: string, _params?: Record<string, string>): Promise<unknown> {
    throw new Error("NotionClient.read is not implemented.");
  },
  async create(_resource: string, _payload: unknown): Promise<unknown> {
    throw new Error("NotionClient.create is not implemented.");
  },
  async update(_resource: string, _id: string, _payload: unknown): Promise<unknown> {
    throw new Error("NotionClient.update is not implemented.");
  },
  async delete(_resource: string, _id: string): Promise<void> {
    throw new Error("NotionClient.delete is not implemented.");
  },
};
