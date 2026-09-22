export type ScriptureVerseRange = {
  start: number;
  end: number;
};

const MAX_VERSE = 200;

function addRange(
  ranges: ScriptureVerseRange[],
  seen: Set<string>,
  start: number,
  end: number,
): void {
  if (!Number.isInteger(start) || !Number.isInteger(end)) return;
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  if (lo < 1 || hi > MAX_VERSE) return;
  const key = `${lo}-${hi}`;
  if (seen.has(key)) return;
  seen.add(key);
  ranges.push({ start: lo, end: hi });
}

export function parseScriptureVerseRanges(claim: string): ScriptureVerseRange[] {
  if (!/\b1\s+samuel\s+17\b/i.test(claim) && !/\b17\s*:/.test(claim)) {
    return [];
  }

  const ranges: ScriptureVerseRange[] = [];
  const seen = new Set<string>();
  let working = claim;

  working = working.replace(
    /\b(?:1\s+samuel\s+)?17\s*:\s*(\d+)\s*[–-]\s*(\d+)\b/gi,
    (_match, start: string, end: string) => {
      addRange(ranges, seen, Number(start), Number(end));
      return " ";
    },
  );
  working = working.replace(
    /\b(?:1\s+samuel\s+)?17\s*:\s*(\d+(?:\s*,\s*\d+)+)\b/gi,
    (_match, list: string) => {
      for (const part of list.split(/\s*,\s*/)) {
        const verse = Number(part);
        addRange(ranges, seen, verse, verse);
      }
      return " ";
    },
  );
  working.replace(/\b(?:1\s+samuel\s+)?17\s*:\s*(\d+)\b/gi, (_match, start: string) => {
    addRange(ranges, seen, Number(start), Number(start));
    return " ";
  });

  return ranges;
}

type VerseMarker = {
  verse: number;
  index: number;
};

function collectVerseMarkers(text: string): VerseMarker[] {
  const markers: VerseMarker[] = [];
  const seen = new Set<number>();

  for (const match of text.matchAll(/\b17\s*:\s*(\d{1,3})\b/g)) {
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
  const markers = collectVerseMarkers(text);
  if (markers.length === 0) return [];

  const windows: string[] = [];
  for (const range of ranges) {
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
