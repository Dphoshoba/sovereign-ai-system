/**
 * Scripture reference parsing for topic-preserving bible research recovery
 * and general primary-scripture claim/source matching.
 */
export type ScriptureRef = {
  book: string;
  /** Canonical display name, e.g. "1 Samuel" or "Exodus" */
  bookDisplay: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
};

type BookDef = {
  display: string;
  aliases: string[];
  slug: string;
};

const BOOKS: BookDef[] = [
  { display: "Genesis", aliases: ["genesis", "gen"], slug: "genesis" },
  { display: "Exodus", aliases: ["exodus", "exod", "exo"], slug: "exodus" },
  { display: "Leviticus", aliases: ["leviticus", "lev"], slug: "leviticus" },
  { display: "Numbers", aliases: ["numbers", "num"], slug: "numbers" },
  { display: "Deuteronomy", aliases: ["deuteronomy", "deut"], slug: "deuteronomy" },
  { display: "Joshua", aliases: ["joshua", "josh"], slug: "joshua" },
  { display: "Judges", aliases: ["judges", "judg"], slug: "judges" },
  { display: "Ruth", aliases: ["ruth"], slug: "ruth" },
  { display: "1 Samuel", aliases: ["1 samuel", "i samuel", "1 sam", "1sa"], slug: "1-samuel" },
  { display: "2 Samuel", aliases: ["2 samuel", "ii samuel", "2 sam", "2sa"], slug: "2-samuel" },
  { display: "1 Kings", aliases: ["1 kings", "i kings", "1 kgs"], slug: "1-kings" },
  { display: "2 Kings", aliases: ["2 kings", "ii kings", "2 kgs"], slug: "2-kings" },
  { display: "1 Chronicles", aliases: ["1 chronicles", "i chronicles", "1 chron", "1 chr"], slug: "1-chronicles" },
  { display: "2 Chronicles", aliases: ["2 chronicles", "ii chronicles", "2 chron", "2 chr"], slug: "2-chronicles" },
  { display: "Ezra", aliases: ["ezra"], slug: "ezra" },
  { display: "Nehemiah", aliases: ["nehemiah", "neh"], slug: "nehemiah" },
  { display: "Esther", aliases: ["esther", "esth"], slug: "esther" },
  { display: "Job", aliases: ["job"], slug: "job" },
  { display: "Psalms", aliases: ["psalms", "psalm", "ps"], slug: "psalms" },
  { display: "Proverbs", aliases: ["proverbs", "prov"], slug: "proverbs" },
  { display: "Ecclesiastes", aliases: ["ecclesiastes", "eccl", "ecc"], slug: "ecclesiastes" },
  {
    display: "Song of Solomon",
    aliases: ["song of solomon", "song of songs", "canticles", "song"],
    slug: "song-of-solomon",
  },
  { display: "Isaiah", aliases: ["isaiah", "isa"], slug: "isaiah" },
  { display: "Jeremiah", aliases: ["jeremiah", "jer"], slug: "jeremiah" },
  { display: "Lamentations", aliases: ["lamentations", "lam"], slug: "lamentations" },
  { display: "Ezekiel", aliases: ["ezekiel", "ezek"], slug: "ezekiel" },
  { display: "Daniel", aliases: ["daniel", "dan"], slug: "daniel" },
  { display: "Hosea", aliases: ["hosea", "hos"], slug: "hosea" },
  { display: "Joel", aliases: ["joel"], slug: "joel" },
  { display: "Amos", aliases: ["amos"], slug: "amos" },
  { display: "Obadiah", aliases: ["obadiah", "obad"], slug: "obadiah" },
  { display: "Jonah", aliases: ["jonah"], slug: "jonah" },
  { display: "Micah", aliases: ["micah", "mic"], slug: "micah" },
  { display: "Nahum", aliases: ["nahum", "nah"], slug: "nahum" },
  { display: "Habakkuk", aliases: ["habakkuk", "hab"], slug: "habakkuk" },
  { display: "Zephaniah", aliases: ["zephaniah", "zeph"], slug: "zephaniah" },
  { display: "Haggai", aliases: ["haggai", "hag"], slug: "haggai" },
  { display: "Zechariah", aliases: ["zechariah", "zech", "zec"], slug: "zechariah" },
  { display: "Malachi", aliases: ["malachi", "mal"], slug: "malachi" },
  { display: "Matthew", aliases: ["matthew", "matt", "mt"], slug: "matthew" },
  { display: "Mark", aliases: ["mark", "mk"], slug: "mark" },
  { display: "Luke", aliases: ["luke", "lk"], slug: "luke" },
  { display: "John", aliases: ["john", "jn"], slug: "john" },
  { display: "Acts", aliases: ["acts"], slug: "acts" },
  { display: "Romans", aliases: ["romans", "rom"], slug: "romans" },
  { display: "1 Corinthians", aliases: ["1 corinthians", "i corinthians", "1 cor", "1co"], slug: "1-corinthians" },
  { display: "2 Corinthians", aliases: ["2 corinthians", "ii corinthians", "2 cor", "2co"], slug: "2-corinthians" },
  { display: "Galatians", aliases: ["galatians", "gal"], slug: "galatians" },
  { display: "Ephesians", aliases: ["ephesians", "eph"], slug: "ephesians" },
  { display: "Philippians", aliases: ["philippians", "phil"], slug: "philippians" },
  { display: "Colossians", aliases: ["colossians", "col"], slug: "colossians" },
  { display: "1 Thessalonians", aliases: ["1 thessalonians", "1 thess", "1th"], slug: "1-thessalonians" },
  { display: "2 Thessalonians", aliases: ["2 thessalonians", "2 thess", "2th"], slug: "2-thessalonians" },
  { display: "1 Timothy", aliases: ["1 timothy", "1 tim", "1ti"], slug: "1-timothy" },
  { display: "2 Timothy", aliases: ["2 timothy", "2 tim", "2ti"], slug: "2-timothy" },
  { display: "Titus", aliases: ["titus"], slug: "titus" },
  { display: "Philemon", aliases: ["philemon", "phlm"], slug: "philemon" },
  { display: "Hebrews", aliases: ["hebrews", "heb"], slug: "hebrews" },
  { display: "James", aliases: ["james", "jas"], slug: "james" },
  { display: "1 Peter", aliases: ["1 peter", "i peter", "1 pet", "1pe"], slug: "1-peter" },
  { display: "2 Peter", aliases: ["2 peter", "ii peter", "2 pet", "2pe"], slug: "2-peter" },
  { display: "1 John", aliases: ["1 john", "i john", "1 jn", "1jo"], slug: "1-john" },
  { display: "2 John", aliases: ["2 john", "ii john", "2 jn"], slug: "2-john" },
  { display: "3 John", aliases: ["3 john", "iii john", "3 jn"], slug: "3-john" },
  { display: "Jude", aliases: ["jude"], slug: "jude" },
  { display: "Revelation", aliases: ["revelation", "rev"], slug: "revelation" },
];

const ALIAS_TO_BOOK = new Map<string, BookDef>();
for (const book of BOOKS) {
  for (const alias of book.aliases) {
    ALIAS_TO_BOOK.set(alias, book);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const BOOK_ALT = BOOKS.flatMap((book) => book.aliases)
  .sort((a, b) => b.length - a.length)
  .map(escapeRegExp)
  .join("|");

/** Matches "Exodus 5:1-9", "2 Corinthians 2:11", "1 Samuel 17". */
export const SCRIPTURE_CITATION_RE = new RegExp(
  `\\b(${BOOK_ALT})\\s+(\\d{1,3})(?:\\s*:\\s*(\\d{1,3})(?:\\s*[–-]\\s*(\\d{1,3}))?)?\\b`,
  "gi",
);

export function normalizeBookAlias(raw: string): BookDef | null {
  const key = raw.toLowerCase().replace(/\s+/g, " ").trim();
  return ALIAS_TO_BOOK.get(key) ?? null;
}

export function parseScriptureRefs(text: string): ScriptureRef[] {
  if (!text.trim()) return [];
  const found: ScriptureRef[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(new RegExp(SCRIPTURE_CITATION_RE.source, "gi"))) {
    const book = normalizeBookAlias(match[1] ?? "");
    const chapter = Number(match[2]);
    if (!book || !Number.isInteger(chapter) || chapter < 1) continue;
    const verseStart = match[3] ? Number(match[3]) : undefined;
    const verseEnd = match[4] ? Number(match[4]) : verseStart;
    const key = `${book.slug}:${chapter}:${verseStart ?? ""}:${verseEnd ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({
      book: book.slug,
      bookDisplay: book.display,
      chapter,
      verseStart,
      verseEnd,
    });
  }
  return found;
}

export function hasScriptureCitation(text: string): boolean {
  return parseScriptureRefs(text).length > 0;
}

export function scriptureDocumentKey(ref: ScriptureRef): string {
  return `${ref.book}-${ref.chapter}`;
}

export function bibleGatewayPassageUrl(ref: ScriptureRef): string {
  const passage =
    ref.verseStart != null
      ? `${ref.bookDisplay} ${ref.chapter}:${ref.verseStart}${
          ref.verseEnd != null && ref.verseEnd !== ref.verseStart
            ? `-${ref.verseEnd}`
            : ""
        }`
      : `${ref.bookDisplay} ${ref.chapter}`;
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(passage)}&version=KJV`;
}

export function bibleHubChapterUrl(ref: ScriptureRef): string {
  const bookPath = ref.book.replace(/-/g, "_");
  return `https://biblehub.com/${bookPath}/${ref.chapter}.htm`;
}

/**
 * Topic keyword recovery when explicit verse refs are absent but the subject
 * clearly names a biblical episode. Never defaults to an unrelated story.
 */
export function inferTopicScriptureSeeds(topic: string): ScriptureRef[] {
  const lower = topic.toLowerCase();
  if (/\b(david\s+and\s+goliath|goliath|1\s+samuel\s+17)\b/i.test(lower)) {
    return [{ book: "1-samuel", bookDisplay: "1 Samuel", chapter: 17 }];
  }
  if (/\b(pharaoh|exodus|egypt|moses|israel'?s?\s+deliverance)\b/i.test(lower)) {
    return [
      { book: "exodus", bookDisplay: "Exodus", chapter: 5 },
      { book: "exodus", bookDisplay: "Exodus", chapter: 8 },
      { book: "exodus", bookDisplay: "Exodus", chapter: 10 },
    ];
  }
  return [];
}

/** Max unique chapters collected for a bible topic (Gateway-first + Hub). */
export const MAX_SCRIPTURE_CHAPTERS = 12;

/**
 * Collapse refs to one fetch target per chapter.
 * Multiple verse ranges in the same chapter (Exodus 8:25-27 + 8:28) become a
 * chapter-level request so later ranges are not discarded.
 */
export function mergeRefsToUniqueChapters(refs: ScriptureRef[]): ScriptureRef[] {
  const grouped = new Map<string, ScriptureRef[]>();
  for (const ref of refs) {
    const key = `${ref.book}-${ref.chapter}`;
    const list = grouped.get(key) ?? [];
    list.push(ref);
    grouped.set(key, list);
  }

  const uniqueChapters: ScriptureRef[] = [];
  for (const list of grouped.values()) {
    const first = list[0];
    if (!first) continue;
    if (list.length === 1) {
      uniqueChapters.push(first);
      continue;
    }
    uniqueChapters.push({
      book: first.book,
      bookDisplay: first.bookDisplay,
      chapter: first.chapter,
    });
  }
  return uniqueChapters;
}

export function scriptureSourcesFromTopic(topic: string): Array<{
  title: string;
  url: string;
  sourceType: string;
  relevanceScore: number;
}> {
  const explicit = parseScriptureRefs(topic);
  const refs =
    explicit.length > 0
      ? explicit
      : inferTopicScriptureSeeds(topic);

  // Prefer chapter diversity for multi-passage briefs. Dual-host redundancy
  // is kept when few chapters are cited; otherwise Gateway-first fills slots.
  // Keep in sync with biblical-teaching-completeness MAX_SCRIPTURE_TEACHING_CHAPTERS.
  //
  // Mission 006R4: when a chapter is cited more than once (Exodus 8:25-27 and
  // Exodus 8:28), keep a chapter-level fetch so later ranges are not dropped.
  const uniqueChapters = mergeRefsToUniqueChapters(refs).slice(
    0,
    MAX_SCRIPTURE_CHAPTERS,
  );

  const sources: Array<{
    title: string;
    url: string;
    sourceType: string;
    relevanceScore: number;
  }> = [];

  // Pass 1: one primary host per chapter (preserves all required passages).
  for (const ref of uniqueChapters) {
    sources.push({
      title: `BibleGateway ${ref.bookDisplay} ${ref.chapter} (KJV)`,
      url: bibleGatewayPassageUrl(ref),
      sourceType: "scripture-reference",
      relevanceScore: 95,
    });
  }

  // Pass 2: secondary host for corroboration while slots remain.
  for (const ref of uniqueChapters) {
    sources.push({
      title: `Bible Hub ${ref.bookDisplay} ${ref.chapter}`,
      url: bibleHubChapterUrl(ref),
      sourceType: "scripture-reference",
      relevanceScore: 90,
    });
  }
  return sources;
}

export function primaryCitationFromClaim(claim: string): ScriptureRef | null {
  const refs = parseScriptureRefs(claim);
  return refs[0] ?? null;
}
export function isScriptureHostUrl(url: string): boolean {
  return /biblegateway\.com|biblehub\.com|blueletterbible\.org|kingjamesbibleonline\.org/i.test(
    url,
  );
}

export function sourceMatchesScriptureRef(
  url: string,
  title: string | null | undefined,
  ref: ScriptureRef,
): boolean {
  if (!isScriptureHostUrl(url)) return false;
  let decoded = url.toLowerCase();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // keep raw lowercased url
  }
  const identity = `${title ?? ""} ${decoded}`.toLowerCase();
  const spacer = "[\\s%+_-]+";
  const bookPatterns = [
    ref.book.replace(/-/g, spacer),
    ref.bookDisplay.toLowerCase().replace(/\s+/g, spacer),
  ];
  const chapter = String(ref.chapter);
  return bookPatterns.some((bookPattern) => {
    const re = new RegExp(`${bookPattern}[\\s%+_-]*${chapter}(?!\\d)`, "i");
    return re.test(identity) || re.test(decoded);
  });
}
