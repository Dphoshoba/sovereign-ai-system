import type {
  ApiClient,
  QuotaDefinition,
  RateLimitTier,
} from "../../platform/connector-platform-sdk";

export const GitHubClient: ApiClient = {
  serviceName: "GitHub",
  baseUrl: "https://api.github.com",
  rateLimitTiers: [
    { name: "Normal", thresholdPercent: 70, score: 100, backoffSeconds: 0 },
    { name: "Elevated", thresholdPercent: 85, score: 70, backoffSeconds: 10 },
    { name: "Warning", thresholdPercent: 95, score: 40, backoffSeconds: 30 },
    { name: "Limited", thresholdPercent: 100, score: 10, backoffSeconds: 60 },
  ] satisfies RateLimitTier[],
  quotaDefinitions: [
    { name: "rest.read", limit: 5000, windowSeconds: 3600 },
    { name: "workflow.write", limit: 1000, windowSeconds: 3600 },
  ] satisfies QuotaDefinition[],
  async read(_resource: string, _params?: Record<string, string>): Promise<unknown> {
    throw new Error("GitHubClient.read is not implemented.");
  },
  async create(_resource: string, _payload: unknown): Promise<unknown> {
    throw new Error("GitHubClient.create is not implemented.");
  },
  async update(_resource: string, _id: string, _payload: unknown): Promise<unknown> {
    throw new Error("GitHubClient.update is not implemented.");
  },
  async delete(_resource: string, _id: string): Promise<void> {
    throw new Error("GitHubClient.delete is not implemented.");
  },
};
