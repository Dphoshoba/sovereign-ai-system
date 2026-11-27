import {
  primaryCitationFromClaim,
  type ScriptureRef,
} from "./scripture-ref";

export type ScriptureVerseRange = {
  start: number;
  end: number;
  chapter?: number;
  book?: string;
};

const MAX_VERSE = 200;

function addRange(
  ranges: ScriptureVerseRange[],
  seen: Set<string>,
  start: number,
  end: number,
  meta?: { chapter?: number; book?: string },
): void {
  if (!Number.isInteger(start) || !Number.isInteger(end)) return;
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  if (lo < 1 || hi > MAX_VERSE) return;
  const key = `${meta?.book ?? ""}:${meta?.chapter ?? ""}:${lo}-${hi}`;
  if (seen.has(key)) return;
  seen.add(key);
  ranges.push({ start: lo, end: hi });
}

/**
 * Parse verse ranges from a scripture claim.
 * Preserves legacy 1 Samuel 17 behaviour and generalizes to any cited book/chapter.
 */
export function parseScriptureVerseRanges(claim: string): ScriptureVerseRange[] {
  const citation = primaryCitationFromClaim(claim);
  const ranges: ScriptureVerseRange[] = [];
  const seen = new Set<string>();

  if (citation?.verseStart != null) {
    addRange(ranges, seen, citation.verseStart, citation.verseEnd ?? citation.verseStart, {
      chapter: citation.chapter,
      book: citation.book,
    });
    return ranges;
  }

  // Legacy / chapter-only claims: scrape chapter:verse markers for the cited chapter
  // (or 1 Samuel 17 when that is the claim subject).
  const chapter =
    citation?.chapter ??
    (/\b1\s+samuel\s+17\b/i.test(claim) || /\b17\s*:/.test(claim) ? 17 : null);
  if (chapter == null) return [];

  let working = claim;
  const chapterPrefix = String(chapter);
  working = working.replace(
    new RegExp(
      `\\b(?:1\\s+samuel\\s+)?${chapterPrefix}\\s*:\\s*(\\d+)\\s*[–-]\\s*(\\d+)\\b`,
      "gi",
    ),
    (_match, start: string, end: string) => {
      addRange(ranges, seen, Number(start), Number(end), {
        chapter,
        book: citation?.book,
      });
      return " ";
    },
  );
  working = working.replace(
    new RegExp(
      `\\b(?:1\\s+samuel\\s+)?${chapterPrefix}\\s*:\\s*(\\d+(?:\\s*,\\s*\\d+)+)\\b`,
      "gi",
    ),
    (_match, list: string) => {
      for (const part of list.split(/\s*,\s*/)) {
        const verse = Number(part);
        addRange(ranges, seen, verse, verse, { chapter, book: citation?.book });
      }
      return " ";
    },
  );
  working.replace(
    new RegExp(`\\b(?:1\\s+samuel\\s+)?${chapterPrefix}\\s*:\\s*(\\d+)\\b`, "gi"),
    (_match, start: string) => {
      addRange(ranges, seen, Number(start), Number(start), {
        chapter,
        book: citation?.book,
      });
      return " ";
    },
  );

  return ranges;
}

type VerseMarker = {
  verse: number;
  index: number;
};

function collectVerseMarkers(text: string, chapter?: number): VerseMarker[] {
  const markers: VerseMarker[] = [];
  const seen = new Set<number>();
  const chapterToken = chapter != null ? String(chapter) : "\\d{1,3}";

  for (const match of text.matchAll(
    new RegExp(`\\b${chapterToken}\\s*:\\s*(\\d{1,3})\\b`, "g"),
  )) {
    const verse = Number(match[1]);
    if (verse < 1 || verse > MAX_VERSE || match.index == null) continue;
    if (seen.has(verse)) continue;
    seen.add(verse);
    markers.push({ verse, index: match.index });
  }

  for (const match of text.matchAll(/(?:^|[\s>])(\d{1,3})(?=\s+[A-Z“"‘'])/g)) {
    const verse = Number(match[1]);
    if (verse < 1 || verse > MAX_VERSE || match.index == null) continue;
    if (seen.has(verse)) continue;
    seen.add(verse);
    const digitIndex = match[0].search(/\d/);
    markers.push({
      verse,
      index: match.index + Math.max(0, digitIndex),
    });
  }

  return markers.sort((left, right) => left.index - right.index);
}

export function locateVerseWindows(
  text: string,
  ranges: ScriptureVerseRange[],
): string[] {
  if (!text || ranges.length === 0) return [];
  const windows: string[] = [];
  for (const range of ranges) {
    const markers = collectVerseMarkers(text, range.chapter);
    if (markers.length === 0) continue;
    const startMarker =
      markers.find((marker) => marker.verse === range.start) ??
      markers.find(
        (marker) => marker.verse >= range.start && marker.verse <= range.end,
      );
    if (!startMarker) continue;
    const after = markers.find(
      (marker) => marker.verse > range.end && marker.index > startMarker.index,
    );
    const endIndex = after
      ? after.index
      : Math.min(text.length, startMarker.index + 900);
    const window = text.slice(startMarker.index, endIndex).replace(/\s+/g, " ").trim();
    if (window.length >= 80) windows.push(window);
  }
  return windows;
}

export function passageOverlapsVerseWindow(
  passage: string,
  windows: string[],
): boolean {
  if (!passage || windows.length === 0) return false;
  const needle = passage.slice(0, 80).replace(/\s+/g, " ").trim();
  if (needle.length < 24) return false;
  return windows.some(
    (window) => window.includes(needle) || needle.includes(window.slice(0, 80)),
  );
}

export type { ScriptureRef };
