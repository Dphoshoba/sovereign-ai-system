import type {
  ApiClient,
  QuotaDefinition,
  RateLimitTier,
} from "../../platform/connector-platform-sdk";

export const OneDriveClient: ApiClient = {
  serviceName: "OneDrive",
  baseUrl: "https://graph.microsoft.com/v1.0/me/drive",
  rateLimitTiers: [
    { name: "Normal", thresholdPercent: 70, score: 100, backoffSeconds: 0 },
    { name: "Elevated", thresholdPercent: 85, score: 70, backoffSeconds: 10 },
    { name: "Warning", thresholdPercent: 95, score: 40, backoffSeconds: 30 },
    { name: "Limited", thresholdPercent: 100, score: 10, backoffSeconds: 60 },
  ] satisfies RateLimitTier[],
  quotaDefinitions: [
    { name: "files.read", limit: 100000, windowSeconds: 86400 },
    { name: "files.write", limit: 10000, windowSeconds: 86400 },
  ] satisfies QuotaDefinition[],
  async read(_resource: string, _params?: Record<string, string>): Promise<unknown> {
    throw new Error("OneDriveClient.read is not implemented.");
  },
  async create(_resource: string, _payload: unknown): Promise<unknown> {
    throw new Error("OneDriveClient.create is not implemented.");
  },
  async update(_resource: string, _id: string, _payload: unknown): Promise<unknown> {
    throw new Error("OneDriveClient.update is not implemented.");
  },
  async delete(_resource: string, _id: string): Promise<void> {
    throw new Error("OneDriveClient.delete is not implemented.");
  },
};
