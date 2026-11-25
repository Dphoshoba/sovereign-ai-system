import { parseScriptureRefs, hasScriptureCitation } from "../../lib/research/scripture-ref";
import {
  isPrimaryScriptureClaim,
  resolveClaimSourceBinding,
} from "../../lib/research/claim-source-attribution";
import { parseScriptureVerseRanges } from "../../lib/research/scripture-verse-locator";

const listed = [
  {
    url: "https://www.biblegateway.com/passage/?search=Zechariah%204%3A10&version=ESV",
    title: "Zechariah 4:10 (ESV)",
  },
  {
    url: "https://www.biblegateway.com/passage/?search=1%20Kings%2019%3A9-18&version=ESV",
    title: "1 Kings 19:9-18 (ESV)",
  },
  {
    url: "https://www.biblegateway.com/passage/?search=Colossians%203%3A22-25%3B%204%3A1&version=ESV",
    title: "Colossians 3:22-25; 4:1 (ESV)",
  },
];

const cases = [
  "“For whoever has despised the day of small things…” (Zechariah 4:10, ESV).",
  "He tells Saul he has kept sheep (1 Samuel 17:34–37, ESV).",
  "Elijah meets the Lord at Horeb (1 Kings 19:9-18, ESV).",
  "“Whatever you do, work heartily…” (Colossians 3:22–25; 4:1, ESV).",
  "“The Lord God took the man…” (Genesis 2:15, ESV).",
];

for (const claim of cases) {
  const binding = resolveClaimSourceBinding(claim, listed);
  console.log(
    JSON.stringify({
      claim: claim.slice(0, 60),
      refs: parseScriptureRefs(claim),
      has: hasScriptureCitation(claim),
      primary: isPrimaryScriptureClaim(claim),
      ranges: parseScriptureVerseRanges(claim),
      role: binding.role,
      exclusiveDocumentKey: binding.exclusiveDocumentKey,
      exclusiveUrl: binding.exclusiveUrl,
    }),
  );
}
