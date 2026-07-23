export type SocialPlatform = 'twitter' | 'linkedin' | 'threads' | 'facebook' | 'instagram' | 'youtube'

export type PlatformCapability = 'draft_generation' | 'approval' | 'text_publishing' | 'media_publishing'

export type PlatformConnectionStatus = 'connected' | 'disconnected' | 'configured' | 'not_configured'

export type PlatformPublishStatus = 'publish_capable' | 'draft_only' | 'unavailable' | 'unsupported'

export interface PlatformCapabilityStatus {
  platform: SocialPlatform
  connectionStatus: PlatformConnectionStatus
  draftGeneration: boolean
  approvalSupported: boolean
  textPublishing: boolean
  mediaPublishing: boolean
  publishStatus: PlatformPublishStatus
  requiresCredentials: boolean
  status: PlatformPublishStatus
}

export interface SocialPublishResult {
  ok: boolean
  externalId?: string
  publicUrl?: string
  publishedAt?: Date
  error?: string
  alreadyPublished?: boolean
}

export interface SocialPublisher {
  readonly platform: SocialPlatform
  readonly capabilities: PlatformCapabilityStatus
  validateConfig(): { valid: boolean; missing: string[] }
  publish(content: string, metadata?: Record<string, string>): Promise<SocialPublishResult>
}

export const PLATFORM_CAPABILITIES: Record<SocialPlatform, PlatformCapabilityStatus> = {
  twitter: {
    platform: 'twitter',
    connectionStatus: 'configured',
    draftGeneration: true,
    approvalSupported: true,
    textPublishing: true,
    mediaPublishing: false,
    publishStatus: 'publish_capable',
    requiresCredentials: true,
    status: 'publish_capable',
  },
  linkedin: {
    platform: 'linkedin',
    connectionStatus: 'not_configured',
    draftGeneration: true,
    approvalSupported: true,
    textPublishing: false,
    mediaPublishing: false,
    publishStatus: 'draft_only',
    requiresCredentials: true,
    status: 'draft_only',
  },
  threads: {
    platform: 'threads',
    connectionStatus: 'not_configured',
    draftGeneration: true,
    approvalSupported: true,
    textPublishing: false,
    mediaPublishing: false,
    publishStatus: 'draft_only',
    requiresCredentials: true,
    status: 'draft_only',
  },
  facebook: {
    platform: 'facebook',
    connectionStatus: 'not_configured',
    draftGeneration: false,
    approvalSupported: false,
    textPublishing: false,
    mediaPublishing: false,
    publishStatus: 'unavailable',
    requiresCredentials: true,
    status: 'unavailable',
  },
  instagram: {
    platform: 'instagram',
    connectionStatus: 'not_configured',
    draftGeneration: false,
    approvalSupported: false,
    textPublishing: false,
    mediaPublishing: false,
    publishStatus: 'unavailable',
    requiresCredentials: true,
    status: 'unavailable',
  },
  youtube: {
    platform: 'youtube',
    connectionStatus: 'not_configured',
    draftGeneration: false,
    approvalSupported: false,
    textPublishing: false,
    mediaPublishing: false,
    publishStatus: 'unsupported',
    requiresCredentials: true,
    status: 'unsupported',
  },
}

export function getPlatformCapabilities(platform: SocialPlatform): PlatformCapabilityStatus {
  return PLATFORM_CAPABILITIES[platform]
}

export function getSupportedPlatforms(): PlatformCapabilityStatus[] {
  return Object.values(PLATFORM_CAPABILITIES)
}
