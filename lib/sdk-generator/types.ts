export interface SDKConfig {
  id: string
  name: string
  language: string
  version: string
  published: boolean
}

export interface SDKGeneratorMetrics {
  totalSDKs: number
  generatedSDKs: number
  averageGenerationTime: number
  publishedVersions: number
}

export interface SDKGeneratorWorkspace {
  sdks: SDKConfig[]
  metrics: SDKGeneratorMetrics
}
