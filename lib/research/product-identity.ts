const PUBLISHER_OR_GENERIC_TOKENS = new Set([
  "nist",
  "deloitte",
  "pwc",
  "cdo",
  "microsoft",
  "outlook",
  "copilot",
  "google",
  "gmail",
  "gemini",
  "workspace",
  "meta",
  "facebook",
  "instagram",
  "threads",
  "intuit",
  "quickbooks",
  "xero",
  "jax",
  "feature",
]);

const PARTICLES = new Set([
  "me",
  "for",
  "to",
  "the",
  "of",
  "a",
  "an",
  "and",
  "with",
  "in",
  "on",
]);

const QUOTED_SPAN = /[“"]([^“”"]+)[”"]/g;
const HELP_ME_LABEL = /\bhelp me\s+[a-z]+\b/gi;
const PAGE_OR_HELP_FOR =
  /(?:\bpage|\bhelp)\s+for\s+((?:[A-Z][A-Za-z0-9]*|[A-Z]{2,})(?:\s+(?:[A-Z][A-Za-z0-9]*|[A-Z]{2,})){1,4})/g;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokensOf(value: string): string[] {
  const normalized = normalize(value);
  return normalized ? normalized.split(" ") : [];
}

function contentTokens(value: string): string[] {
  return tokensOf(value).filter(
    (token) => !PARTICLES.has(token) && !PUBLISHER_OR_GENERIC_TOKENS.has(token),
  );
}

function containsPhrase(text: string, phrase: string): boolean {
  if (!phrase) return false;
  return ` ${normalize(text)} `.includes(` ${phrase} `);
}

function isHelpMeLabel(value: string): boolean {
  return /^help me\s+[a-z]+$/i.test(value.trim());
}

function isExplicitFeatureLabel(value: string): boolean {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned || contentTokens(cleaned).length < 2) return false;
  if (isHelpMeLabel(cleaned)) return true;
  if (/[.!?]/.test(cleaned) || /[’']/u.test(cleaned)) return false;
  const words = cleaned.split(" ");
  if (words.length < 2 || words.length > 5) return false;
  if (!/^[A-Z]/.test(words[0] ?? "")) return false;
  const titled = words.every((word) => {
    const token = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    return /^[A-Z0-9]/.test(word) || PARTICLES.has(token);
  });
  const namesAMeFeature = words.length <= 4 && /\bme\b/i.test(cleaned);
  return titled || namesAMeFeature;
}

function remember(features: Map<string, string>, label: string): void {
  const cleaned = label.replace(/\s+/g, " ").trim();
  if (!isExplicitFeatureLabel(cleaned)) return;
  const key = normalize(cleaned);
  if (!key || features.has(key)) return;
  features.set(key, cleaned);
}

export function namedProductFeatures(text: string): string[] {
  const features = new Map<string, string>();
  for (const match of text.matchAll(PAGE_OR_HELP_FOR)) {
    remember(features, match[1] ?? "");
  }
  for (const match of text.matchAll(QUOTED_SPAN)) {
    remember(features, match[1] ?? "");
  }
  for (const match of text.matchAll(HELP_ME_LABEL)) {
    remember(features, match[0] ?? "");
  }
  return Array.from(features.values());
}

function identityPhrases(feature: string): string[] {
  const full = normalize(feature);
  const tokens = full.split(" ").filter(Boolean);
  const coreTokens = [...tokens];
  while (coreTokens.length > 0 && PUBLISHER_OR_GENERIC_TOKENS.has(coreTokens[0] ?? "")) {
    coreTokens.shift();
  }
  while (
    coreTokens.length > 0 &&
    PUBLISHER_OR_GENERIC_TOKENS.has(coreTokens[coreTokens.length - 1] ?? "")
  ) {
    coreTokens.pop();
  }
  const core = coreTokens.join(" ");
  if (coreTokens.length >= 2 && core !== full) return [full, core];
  return full ? [full] : [];
}

function sameFeature(left: string, right: string): boolean {
  const rightPhrases = new Set(identityPhrases(right));
  return identityPhrases(left).some((phrase) => rightPhrases.has(phrase));
}

function identifiesFeature(
  feature: string,
  sourceTitle: string,
  passage: string,
): boolean {
  const phrases = identityPhrases(feature);
  if (phrases.some((phrase) => containsPhrase(passage, phrase))) return true;
  if (!phrases.some((phrase) => containsPhrase(sourceTitle, phrase))) return false;
  return !namedProductFeatures(passage).some((other) => !sameFeature(other, feature));
}

export function evidenceSatisfiesProductIdentity(
  claim: string,
  sourceTitle: string,
  passage: string,
): boolean {
  const features = namedProductFeatures(claim);
  if (features.length === 0) return true;
  return features.every((feature) =>
    identifiesFeature(feature, sourceTitle, passage),
  );
}
