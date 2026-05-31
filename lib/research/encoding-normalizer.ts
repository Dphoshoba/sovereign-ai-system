export function encodingNormalizer(text: string): string {
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
      // CP1252 mojibake: â followed by typographic € ™ etc.
      .replace(/â€™/g, "'")
      .replace(/â€˜/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .replace(/â€"/g, "—")
      .replace(/â€”/g, "—")
      .replace(/â€“/g, "–")
      // Contraction fallbacks: tolerate 0-2 junk chars between â and the letter
      .replace(/itâ.{0,2}s/g, "it's")
      .replace(/donâ.{0,2}t/g, "don't")
      .replace(/doesnâ.{0,2}t/g, "doesn't")
      .replace(/canâ.{0,2}t/g, "can't")
      .replace(/wonâ.{0,2}t/g, "won't")
      // Misc leftovers
      .replace(/Â©/g, "©")
      .replace(/Â/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
  )
}
