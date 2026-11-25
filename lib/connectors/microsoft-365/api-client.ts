import type {
  ApiClient,
  QuotaDefinition,
  RateLimitTier,
} from "../../platform/connector-platform-sdk";

export const Microsoft365Client: ApiClient = {
  serviceName: "Microsoft 365",
  baseUrl: "https://graph.microsoft.com/v1.0",
  rateLimitTiers: [
    { name: "Normal", thresholdPercent: 70, score: 100, backoffSeconds: 0 },
    { name: "Elevated", thresholdPercent: 85, score: 70, backoffSeconds: 10 },
    { name: "Warning", thresholdPercent: 95, score: 40, backoffSeconds: 30 },
    { name: "Limited", thresholdPercent: 100, score: 10, backoffSeconds: 60 },
  ] satisfies RateLimitTier[],
  quotaDefinitions: [
    { name: "graph.read", limit: 10000, windowSeconds: 600 },
    { name: "graph.write", limit: 2000, windowSeconds: 600 },
  ] satisfies QuotaDefinition[],
  async read(_resource: string, _params?: Record<string, string>): Promise<unknown> {
    throw new Error("Microsoft365Client.read is not implemented.");
  },
  async create(_resource: string, _payload: unknown): Promise<unknown> {
    throw new Error("Microsoft365Client.create is not implemented.");
  },
  async update(_resource: string, _id: string, _payload: unknown): Promise<unknown> {
    throw new Error("Microsoft365Client.update is not implemented.");
  },
  async delete(_resource: string, _id: string): Promise<void> {
    throw new Error("Microsoft365Client.delete is not implemented.");
  },
};
