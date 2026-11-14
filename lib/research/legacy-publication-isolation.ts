export const LEGACY_RESEARCH_RESPONSE_AUTHORISES_ARTICLE = false;

export function legacyResearchPublicationEnvelope<T extends object>(
  body: T,
): T & { articlePublicationAuthorised: false } {
  return {
    ...body,
    articlePublicationAuthorised: LEGACY_RESEARCH_RESPONSE_AUTHORISES_ARTICLE,
  };
}
