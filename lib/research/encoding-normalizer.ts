function looksLikeMojibake(text: string): boolean {
  return /â|Ã|â€/.test(text)
}

function tryUtf8Repair(text: string): string {
  // Only repair when text shows mojibake markers. Running latin1→utf8 on valid
  // UTF-8 from OpenAI corrupts em dashes (— → U+0014) and curly apostrophes
  // (’ → U+0019), which display as missing punctuation and glued words.
  if (!looksLikeMojibake(text)) {
    return text
  }

  try {
    return Buffer.from(text, "latin1").toString("utf8")
  } catch {
    return text
  }
}

export function encodingNormalizer(text: string): string {
  text = tryUtf8Repair(text)

  return (
    text
      // Raw Latin-1 mojibake: UTF-8 bytes E2 80 9x decoded as â + control chars
      .replace(/\u00e2\u0080\u0099/g, "'")
      .replace(/\u00e2\u0080\u0098/g, "'")
      .replace(/\u00e2\u0080\u009c/g, '"')
      .replace(/\u00e2\u0080\u009d/g, '"')
      .replace(/\u00e2\u0080\u0094/g, "—")
      .replace(/\u00e2\u0080\u0093/g, "–")
      .replace(/\u00e2\u0080\u00a6/g, "…")
      // Specific CP1252 mojibake: â€ followed by a typographic char. These MUST
      // run before the broad /â€/ fallback below, otherwise that fallback eats
      // the "â€" prefix and leaves the trailing byte behind.
      .replace(/â€™/g, "'")
      .replace(/â€˜/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€"/g, '"')
      .replace(/â€"/g, "—")
      .replace(/â€”/g, "—")
      .replace(/â€“/g, "–")
      .replace(/â€¦/g, "…")
      .replace(/â€\u009d/g, '"')
      .replace(/â€\u009c/g, '"')
      .replace(/â€\u0099/g, "'")
      .replace(/â€\u0098/g, "'")
      // Exact contraction fixes (â standing in for apostrophe).
      .replace(/thatâs/gi, "that's")
      .replace(/iâm/g, "I'm")
      .replace(/weâre/gi, "we're")
      .replace(/youâre/gi, "you're")
      .replace(/theyâll/gi, "they'll")
      .replace(/isnât/gi, "isn't")
      .replace(/wonât/gi, "won't")
      .replace(/donât/gi, "don't")
      .replace(/canât/gi, "can't")
      // Contraction fallbacks: tolerate 0-2 junk chars between â and the letter.
      // These must also run before the broad /â€/ fallback so the apostrophe is
      // reconstructed instead of being turned into a double quote.
      .replace(/itâ.{0,2}s/gi, "it's")
      .replace(/donâ.{0,2}t/gi, "don't")
      .replace(/doesnâ.{0,2}t/gi, "doesn't")
      .replace(/canâ.{0,2}t/gi, "can't")
      .replace(/wonâ.{0,2}t/gi, "won't")
      .replace(/thatâ.{0,2}s/gi, "that's")
      .replace(/letâ.{0,2}s/gi, "let's")
      .replace(/youâ.{0,2}re/gi, "you're")
      .replace(/youâ.{0,2}ll/gi, "you'll")
      .replace(/youâ.{0,2}ve/gi, "you've")
      .replace(/theyâ.{0,2}re/gi, "they're")
      .replace(/theyâ.{0,2}ll/gi, "they'll")
      .replace(/theyâ.{0,2}ve/gi, "they've")
      .replace(/weâ.{0,2}re/gi, "we're")
      .replace(/weâ.{0,2}ll/gi, "we'll")
      .replace(/weâ.{0,2}ve/gi, "we've")
      .replace(/thereâ.{0,2}s/gi, "there's")
      .replace(/hereâ.{0,2}s/gi, "here's")
      .replace(/whatâ.{0,2}s/gi, "what's")
      .replace(/whoâ.{0,2}s/gi, "who's")
      .replace(/Iâ.{0,2}m/g, "I'm")
      .replace(/Iâ.{0,2}ll/g, "I'll")
      .replace(/isnâ.{0,2}t/gi, "isn't")
      .replace(/arenâ.{0,2}t/gi, "aren't")
      .replace(/wasnâ.{0,2}t/gi, "wasn't")
      .replace(/werenâ.{0,2}t/gi, "weren't")
      .replace(/didnâ.{0,2}t/gi, "didn't")
      .replace(/wouldnâ.{0,2}t/gi, "wouldn't")
      .replace(/couldnâ.{0,2}t/gi, "couldn't")
      .replace(/shouldnâ.{0,2}t/gi, "shouldn't")
      .replace(/hasnâ.{0,2}t/gi, "hasn't")
      .replace(/havenâ.{0,2}t/gi, "haven't")
      .replace(/hadnâ.{0,2}t/gi, "hadn't")
      // Dash fixes: lone â mojibake standing in for an em dash.
      .replace(/â\s*-\s*/g, "—")
      .replace(/â\s*becomes/gi, "—becomes")
      .replace(/â\s*less/gi, "—less")
      .replace(/â\s*no/gi, "—no")
      // Phrase fixes: lone â mojibake used as curly quotes around common phrases.
      .replace(/âmore AI\.â/g, '"more AI."')
      .replace(/âblank pageâ/g, '"blank page"')
      .replace(/âfirst draftâ/g, '"first draft"')
      .replace(/âdoneâ/g, '"done"')
      .replace(/âposted\.â/g, '"posted."')
      // Broad CP1252 fallback: any remaining "â€" becomes a double quote. Runs
      // AFTER all specific sequences and contraction fallbacks above.
      .replace(/â€/g, '"')
      // Misc leftovers
      .replace(/â¢/g, "•")
      .replace(/Â©/g, "©")
      .replace(/Â/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x26;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/letâs/gi, "let's")
      .replace(/weâre/gi, "we're")
      .replace(/iâm/g, "I'm")
      .replace(/youâre/gi, "you're")
      .replace(/theyâll/gi, "they'll")
      .replace(/donât/gi, "don't")
      .replace(/canât/gi, "can't")
      .replace(/wonât/gi, "won't")
      .replace(/isnât/gi, "isn't")
      .replace(/whatâs/gi, "what's")
      .replace(/thatâs/gi, "that's")
      .replace(/itâs/gi, "it's")
      .replace(/thereâs/gi, "there's")
      .replace(/hereâs/gi, "here's")
      .replace(/âthe futureâ/gi, '"the future"')
      .replace(/âsystems thinkingâ/gi, '"systems thinking"')
      .replace(/âtool collectingâ/gi, '"tool collecting"')
      .replace(/âideaâ/gi, '"idea"')
      .replace(/âfirst draftâ/gi, '"first draft"')
      .replace(/âyes\/noâ/gi, '"yes/no"')
      .replace(/âtop 10 audience questionsâ/gi, '"Top 10 audience questions"')
      .replace(/â3 content threads to continueâ/gi, '"3 content threads to continue"')
      .replace(/âOffer improvements to considerâ/gi, '"Offer improvements to consider"')
      .replace(/âHuman Coreâ/gi, '"Human Core"')
      .replace(/âwithout/gi, "—without")
      .replace(/âwith/gi, "—with")
      .replace(/âcovering/gi, "—covering")
      .replace(/âincluding/gi, "—including")
      .replace(/âespecially/gi, "—especially")
      .replace(/âbecause/gi, "—because")
      .replace(/âwhile/gi, "—while")
      .replace(/âand/gi, "—and")
      .replace(/âbut/gi, "—but")
      .replace(/âso/gi, "—so")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b(the)(future)\b/gi, "$1 $2")
      .replace(/\b(and)(business)\b/gi, "$1 $2")
      .replace(/\b(agencies),(and)\b/gi, "$1, $2")
      .replace(/\b(workflows),(and)\b/gi, "$1, $2")
      .replace(/\b(can)(swap)\b/gi, "$1 $2")
      .replace(/\b(content)(production)\b/gi, "$1 $2")
      .replace(/\b(automation)(should)\b/gi, "$1 $2")
      .replace(/\b(evidence)(we)\b/gi, "$1 $2")
      .replace(/\b(voice)(instead)\b/gi, "$1 $2")
      .replace(/\b(systems)(that)\b/gi, "$1 $2")
      .replace(/\b(over)(to)\b/gi, "$1 $2")
      .replace(/([a-z0-9])â([a-z])/gi, "$1—$2")
      .replace(/â/g, "—")
      // Undo latin1-roundtrip artifacts on valid UTF-8 punctuation.
      .replace(/\u0014/g, "—")
      .replace(/\u0019/g, "'")
      .replace(/\u0018/g, "'")
      .replace(/\*\*—(?=[a-z])/gi, "** — ")
      .replace(/([a-z0-9])—([a-z])/gi, "$1 — $2")
      .replace(/\s+/g, " ")
      .trim()
  )
}
