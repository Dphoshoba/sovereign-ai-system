/**
 * Subject-preserving biblical passage extraction.
 * Claims must follow the requested topic / passage subject.
 * Never invent David-and-Goliath assertions from generic religious vocabulary.
 *
 * Called by: lib/research/fact-extractor.ts buildClaims (bible category path).
 */

export type BibleSubject = "david-goliath" | "exodus-deliverance" | "generic";

export type BibleExtractionResult = {
  people: string[];
  places: string[];
  objects: string[];
  events: string[];
  dialogue: string[];
  themes: string[];
  /** Pastoral/application notes — must not be promoted to verified FACT claims. */
  applications: string[];
  claims: string[];
  subject: BibleSubject;
};

function unique(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean);
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

/**
 * True when a claim/event string belongs to the David-and-Goliath narrative,
 * including Philistine / confrontation phrasing that omits the word "Goliath".
 */
export function isDavidGoliathNarrativeClaim(claim: string): boolean {
  const text = claim.toLowerCase();
  if (/\bdavid and goliath\b/.test(text) || /\bgoliath\b/.test(text)) return true;
  if (/\bphilistines?\b/.test(text)) return true;
  if (/\b1\s*sam(?:uel)?\s*17\b/.test(text)) return true;
  if (
    /\bdavid\b/.test(text) &&
    /\b(confrontation|confront|sling|stone|saul questions|volunteers to confront|simple weapons)\b/.test(
      text,
    )
  ) {
    return true;
  }
  if (/saul questions david/i.test(text)) return true;
  return false;
}

/** Resolve a chapter number from a BibleGateway / Bible Hub source identity. */
export function chapterFromScriptureSource(
  url: string,
  title = "",
): number | null {
  let decoded = `${url} ${title}`;
  try {
    decoded = `${decodeURIComponent(url)} ${title}`;
  } catch {
    // keep raw identity
  }
  const match = decoded.match(
    /\b(?:exodus|1\s*samuel|1samuel|samuel)[\s%+/_-]*(\d{1,3})\b/i,
  );
  if (!match) return null;
  const chapter = Number(match[1]);
  return Number.isInteger(chapter) && chapter > 0 ? chapter : null;
}

/**
 * Prefer an explicit topic subject; fall back to passage markers.
 * Generic Lord/God/Israel alone never selects David and Goliath.
 * Saul + David alone is not enough (anointing / fugitive narratives).
 */
export function detectBibleSubject(topic: string, passageText = ""): BibleSubject {
  const topicLower = topic.toLowerCase();
  const passageLower = passageText.toLowerCase();

  if (
    /\b(david\s+and\s+goliath|goliath|1\s*sam(?:uel)?\s*17|1samuel\s*17)\b/.test(
      topicLower,
    ) ||
    (/\bdavid\b/.test(topicLower) && /\b(philistine|goliath)\b/.test(topicLower))
  ) {
    return "david-goliath";
  }

  if (
    /\b(pharaoh|exodus|egypt|moses|israel'?s?\s+deliverance|let my people go)\b/.test(
      topicLower,
    )
  ) {
    return "exodus-deliverance";
  }

  if (
    /\b(david\s+and\s+goliath|goliath|1\s*sam(?:uel)?\s*17)\b/.test(passageLower) ||
    (/\bdavid\b/.test(passageLower) && /\b(goliath|philistine)\b/.test(passageLower))
  ) {
    return "david-goliath";
  }

  if (
    /\b(pharaoh|exodus|moses|egypt|let my people go|bricks?|straw)\b/.test(passageLower)
  ) {
    return "exodus-deliverance";
  }

  return "generic";
}

export type BibleExtractOptions = {
  topic?: string;
  chapter?: number | null;
  sourceUrl?: string;
  sourceTitle?: string;
};

function extractDavidGoliath(lower: string): Omit<BibleExtractionResult, "subject"> {
  const people: string[] = [];
  const places: string[] = [];
  const objects: string[] = [];
  const events: string[] = [];
  const dialogue: string[] = [];
  const themes: string[] = [];
  const applications: string[] = [];
  const claims: string[] = [];

  if (lower.includes("david")) people.push("David");
  if (lower.includes("goliath")) people.push("Goliath");
  if (lower.includes("saul")) people.push("Saul");
  if (lower.includes("jesse")) people.push("Jesse");
  if (lower.includes("philistine")) people.push("Philistines");
  if (lower.includes("israel")) people.push("Israel");

  if (lower.includes("elah")) places.push("Valley of Elah");
  if (lower.includes("bethlehem")) places.push("Bethlehem");

  if (includesAny(lower, ["sling", "stone", "staff"])) {
    objects.push("David's simple weapons");
  }

  if (includesAny(lower, ["armor", "sword", "spear", "shield"])) {
    objects.push("Conventional battle equipment");
  }

  if (
    lower.includes("david") &&
    lower.includes("goliath") &&
    includesAny(lower, ["fight", "battle", "war", "army", "camp", "confront"])
  ) {
    events.push("David and Goliath is set within a military conflict.");
  }

  if (lower.includes("saul") && includesAny(lower, ["cannot", "not able", "boy", "youth"])) {
    events.push("Saul questions David's ability to fight Goliath.");
  }

  if (lower.includes("david") && lower.includes("goliath")) {
    events.push("David confronts Goliath.");
    claims.push("The account of David and Goliath centers on David confronting Goliath.");
  }

  if (lower.includes("philistine")) {
    themes.push("Conflict");
    claims.push("The David and Goliath account involves conflict with the Philistines.");
  }

  if (lower.includes("saul") && (lower.includes("david") || lower.includes("goliath"))) {
    claims.push("The David and Goliath account takes place during the reign of Saul.");
  }

  if (
    (lower.includes("david") || lower.includes("goliath")) &&
    includesAny(lower, ["lord", "god", "faith", "trust"])
  ) {
    themes.push("Trust in God");
    applications.push("Faith can shape courage in intimidating circumstances.");
    claims.push("The David and Goliath account highlights trust in God.");
  }

  if (includesAny(lower, ["heart fail", "afraid", "fear"]) && lower.includes("david")) {
    themes.push("Courage over fear");
    applications.push("Fear can be confronted through faithful action.");
  }

  if (
    lower.includes("david") &&
    includesAny(lower, ["go and fight", "will go", "fight him"])
  ) {
    dialogue.push("David expresses willingness to confront the Philistine.");
    events.push("David volunteers to confront the Philistine.");
  }

  if (includesAny(lower, ["stone", "sling"]) && lower.includes("david")) {
    events.push("David uses simple weapons in the confrontation with Goliath.");
    claims.push("David used simple weapons in the confrontation with Goliath.");
  }

  if (lower.includes("goliath") && includesAny(lower, ["defy", "challenge"])) {
    events.push("Goliath challenges Israel.");
    claims.push("Goliath challenged Israel in the David and Goliath account.");
  }

  return {
    people: unique(people),
    places: unique(places),
    objects: unique(objects),
    events: unique(events),
    dialogue: unique(dialogue),
    themes: unique(themes),
    applications: unique(applications),
    claims: unique(claims),
  };
}

function extractExodusDeliverance(
  lower: string,
  chapter?: number | null,
): Omit<BibleExtractionResult, "subject"> {
  const people: string[] = [];
  const places: string[] = [];
  const objects: string[] = [];
  const events: string[] = [];
  const dialogue: string[] = [];
  const themes: string[] = [];
  const applications: string[] = [];
  const claims: string[] = [];
  const accordingTo =
    chapter != null && chapter > 0
      ? `According to Exodus ${chapter},`
      : "According to Exodus,";

  if (lower.includes("pharaoh")) people.push("Pharaoh");
  if (lower.includes("moses")) people.push("Moses");
  if (lower.includes("aaron")) people.push("Aaron");
  if (includesAny(lower, ["israel", "israelites", "hebrews"])) people.push("Israel");

  if (lower.includes("egypt")) places.push("Egypt");
  if (lower.includes("wilderness")) places.push("wilderness");

  if (includesAny(lower, ["brick", "straw", "taskmaster"])) {
    objects.push("Forced labor materials");
  }

  if (includesAny(lower, ["flock", "herd", "cattle", "livestock"])) {
    objects.push("Livestock and possessions");
  }

  if (includesAny(lower, ["let my people go", "let israel go"])) {
    dialogue.push("The Lord commands Pharaoh to let Israel go.");
    claims.push(
      `${accordingTo} the Lord commands Pharaoh to let Israel go and worship Him.`,
    );
  }

  if (
    lower.includes("pharaoh") &&
    includesAny(lower, [
      "who is the lord",
      "know not the lord",
      "will not let",
      "neither will i let",
    ])
  ) {
    events.push("Pharaoh refuses the Lord's command to release Israel.");
    claims.push(`${accordingTo} Pharaoh refuses to let Israel go.`);
  }

  if (
    includesAny(lower, ["more work", "heavier", "brick", "straw", "task"]) &&
    includesAny(lower, ["pharaoh", "taskmaster", "people", "israel"])
  ) {
    events.push("Israel's labor burden increases under Pharaoh.");
    claims.push(
      `${accordingTo} Pharaoh increases Israel's suffering through heavier labor.`,
    );
  }

  if (
    includesAny(lower, ["sacrifice", "serve", "worship"]) &&
    includesAny(lower, ["land", "egypt", "here"])
  ) {
    events.push("Pharaoh offers worship confined within Egypt.");
    claims.push(
      `${accordingTo} Pharaoh offers a compromise that Israel serve God within Egypt.`,
    );
  }

  if (includesAny(lower, ["not very far", "not go very far", "go not very far"])) {
    events.push("Pharaoh limits how far Israel may go.");
    claims.push(
      `${accordingTo} Pharaoh says Israel may go but not very far away.`,
    );
  }

  if (
    includesAny(lower, ["little ones", "children", "your little"]) &&
    includesAny(lower, ["pharaoh", "go", "leave", "stay"])
  ) {
    events.push("Pharaoh seeks to keep Israel's children behind.");
    claims.push(
      `${accordingTo} Pharaoh tries to make Israel leave their children behind.`,
    );
  }

  if (
    includesAny(lower, ["flock", "herd", "cattle", "livestock"]) &&
    includesAny(lower, ["leave", "stay", "remain", "behind", "pharaoh"])
  ) {
    events.push("Pharaoh seeks to keep Israel's possessions in Egypt.");
    claims.push(
      `${accordingTo} Pharaoh tries to make Israel leave their flocks and possessions behind.`,
    );
  }

  if (lower.includes("moses") && lower.includes("aaron") && lower.includes("pharaoh")) {
    events.push("Moses and Aaron confront Pharaoh.");
  }

  if (includesAny(lower, ["lord", "god"]) && lower.includes("pharaoh")) {
    themes.push("Obedience under pressure");
  }

  if (includesAny(lower, ["compromise", "not very far", "within egypt", "leave"])) {
    themes.push("Resistance through compromise");
    applications.push(
      "Spiritual pressure often arrives as a compromise that keeps part of life in bondage.",
    );
  }

  return {
    people: unique(people),
    places: unique(places),
    objects: unique(objects),
    events: unique(events),
    dialogue: unique(dialogue),
    themes: unique(themes),
    applications: unique(applications),
    claims: unique(claims),
  };
}

function extractGeneric(lower: string): Omit<BibleExtractionResult, "subject"> {
  const themes: string[] = [];

  // Neutral themes only — never story-specific canned narratives.
  if (includesAny(lower, ["lord", "god", "faith", "trust"])) {
    themes.push("Trust in God");
  }
  if (includesAny(lower, ["afraid", "fear", "courage"])) {
    themes.push("Courage over fear");
  }

  return {
    people: [],
    places: [],
    objects: [],
    events: [],
    dialogue: [],
    themes: unique(themes),
    applications: [],
    claims: [],
  };
}

/**
 * Text-tethered supporting-passage claims for multi-brief teaching.
 * Only fires when the evidence sentence itself contains the markers.
 */
function extractSupportingPassageClaims(
  lower: string,
): Omit<BibleExtractionResult, "subject"> {
  const claims: string[] = [];
  const events: string[] = [];
  const themes: string[] = [];

  if (
    includesAny(lower, [
      "thief cometh",
      "steal, and to kill",
      "more abundantly",
    ])
  ) {
    claims.push(
      "According to John 10:10, the thief comes to steal, kill, and destroy, while Christ gives life more abundantly.",
    );
    events.push("Jesus contrasts the thief with abundant life.");
  }
  if (
    includesAny(lower, ["not ignorant of his devices", "advantage of us"])
  ) {
    claims.push(
      "According to 2 Corinthians 2:11, believers must not be ignorant of Satan's devices.",
    );
  }
  if (includesAny(lower, ["deny himself", "take up his cross", "follow me"])) {
    claims.push(
      "According to Mark 8:34, discipleship requires denying self, taking up the cross, and following Christ.",
    );
  }
  if (includesAny(lower, ["choose you this day", "whom ye will serve"])) {
    claims.push(
      "According to Joshua 24:15, the people must choose whom they will serve.",
    );
  }
  if (
    includesAny(lower, [
      "living sacrifice",
      "transformed by the renewing",
      "not conformed to this world",
    ])
  ) {
    claims.push(
      "According to Romans 12:1-2, believers present themselves as a living sacrifice and are transformed by renewing the mind.",
    );
  }
  if (
    includesAny(lower, [
      "seek those things which are above",
      "set your affection on things above",
      "hid with christ in god",
    ])
  ) {
    claims.push(
      "According to Colossians 3:1-4, believers set their affection on things above where Christ is.",
    );
  }
  if (includesAny(lower, ["whole armour of god", "stand against the wiles"])) {
    claims.push(
      "According to Ephesians 6:11, believers put on the whole armour of God to stand against the devil's wiles.",
    );
  }
  if (
    includesAny(lower, [
      "be sober, be vigilant",
      "adversary the devil",
      "roaring lion",
    ])
  ) {
    claims.push(
      "According to 1 Peter 5:8, believers must be sober and vigilant because the adversary walks about as a roaring lion.",
    );
  }
  if (includesAny(lower, ["resist the devil", "he will flee"])) {
    claims.push(
      "According to James 4:7, believers submit to God, resist the devil, and he will flee.",
    );
  }

  if (claims.length > 0) themes.push("Spiritual vigilance");

  return {
    people: [],
    places: [],
    objects: [],
    events: unique(events),
    dialogue: [],
    themes: unique(themes),
    applications: [],
    claims: unique(claims),
  };
}

function sourceLooksLikeExodus(url: string, title: string): boolean {
  return /\bexodus\b/i.test(`${url} ${title}`);
}

function sourceLooksLikeSamuel(url: string, title: string): boolean {
  return /\b1\s*samuel\b|samuel%2017|1-samuel/i.test(`${url} ${title}`);
}

/**
 * Extract biblical entities and claims from a passage sentence.
 * @param text Passage or evidence sentence
 * @param topicOrOptions Director topic string, or options with topic/chapter/source
 */
export function bibleExtractor(
  text: string,
  topicOrOptions: string | BibleExtractOptions = "",
): BibleExtractionResult {
  const options: BibleExtractOptions =
    typeof topicOrOptions === "string"
      ? { topic: topicOrOptions }
      : topicOrOptions;
  const topic = options.topic ?? "";
  const chapter =
    options.chapter ??
    chapterFromScriptureSource(options.sourceUrl ?? "", options.sourceTitle ?? "");
  const lower = text.toLowerCase();
  const subject = detectBibleSubject(topic, text);
  const sourceUrl = options.sourceUrl ?? "";
  const sourceTitle = options.sourceTitle ?? "";
  const exodusSource = sourceLooksLikeExodus(sourceUrl, sourceTitle);
  const samuelSource = sourceLooksLikeSamuel(sourceUrl, sourceTitle);

  // Prefer extraction matched to the evidence source book so an Exodus topic
  // still extracts John/Paul/James claims from those chapters' evidence.
  let base: Omit<BibleExtractionResult, "subject">;
  if (subject === "david-goliath" && (samuelSource || !exodusSource)) {
    base = extractDavidGoliath(lower);
  } else if (subject === "exodus-deliverance" && (exodusSource || !sourceUrl)) {
    base = extractExodusDeliverance(lower, chapter);
  } else if (subject === "exodus-deliverance" && !exodusSource) {
    base = extractGeneric(lower);
  } else if (subject === "david-goliath") {
    base = extractDavidGoliath(lower);
  } else {
    base = extractGeneric(lower);
  }

  const supporting = extractSupportingPassageClaims(lower);
  const mergedClaims = unique([...base.claims, ...supporting.claims]);
  const mergedEvents = unique([...base.events, ...supporting.events]);
  const mergedThemes = unique([...base.themes, ...supporting.themes]);

  // Hard guard: never emit D&G claim strings outside the D&G subject.
  const claims =
    subject === "david-goliath"
      ? mergedClaims
      : mergedClaims.filter((claim) => !isDavidGoliathNarrativeClaim(claim));

  const events =
    subject === "david-goliath"
      ? mergedEvents
      : mergedEvents.filter((event) => !isDavidGoliathNarrativeClaim(event));

  return {
    ...base,
    themes: mergedThemes,
    claims: unique(claims),
    events: unique(events),
    subject,
  };
}
