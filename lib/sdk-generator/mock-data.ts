import type { SDKGeneratorWorkspace } from "./types"

export const SDK_GENERATOR_ASSETS: SDKGeneratorWorkspace = {
  sdks: [
    {
      id: "sdk-001",
      name: "JavaScript SDK",
      language: "javascript",
      version: "2.1.0",
      published: true,
    },
    {
      id: "sdk-002",
      name: "Python SDK",
      language: "python",
      version: "1.8.5",
      published: true,
    },
  ],
  metrics: {
    totalSDKs: 2,
    generatedSDKs: 2,
    averageGenerationTime: 3200,
    publishedVersions: 8,
  },
}
