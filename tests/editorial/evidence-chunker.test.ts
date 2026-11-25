import { describe, expect, it } from "vitest";
import { passageSupportsClaim } from "../../lib/research/article-claim-extractor";
import { evidenceChunker } from "../../lib/research/evidence-chunker";

const ERROR_CLAIM =
  "They found minor factual errors in 28 percent of the documents and major factual errors in 12 percent.";
const ERROR_SENTENCE =
  "In an analysis conducted on 200 documents edited during the first study, we found that 28% of the documents contained minor factual errors, and 12% contained major factual errors.";
const TIME_CLAIM = "Average time fell by 40 percent.";
const MIT_SENTENCE =
  "Access to the assistive chatbot ChatGPT decreased the time it took workers to complete the tasks by 40 percent, and output quality, as measured by independent evaluators, rose by 18 percent.";

function words(value: string): string[] {
  return value.split(/\s+/).filter(Boolean);
}

describe("sentence-preserving evidence chunks", () => {
  it("keeps a 28% and 12% sentence together inside the 120-word cap", () => {
    const lead = `${Array.from({ length: 110 }, (_, index) => `lead${index}`).join(" ")}.`;
    const text = `${lead} ${ERROR_SENTENCE}`;
    const chunks = evidenceChunker(text, 120);
    const match = chunks.find((chunk) => chunk.text.includes("28%") && chunk.text.includes("12%"));

    expect(match).toBeDefined();
    expect(match?.wordCount).toBeLessThanOrEqual(120);
    expect(passageSupportsClaim(ERROR_CLAIM, match?.text ?? "", { documentKind: "html" })).toBe(true);
    expect(chunks.some((chunk) => chunk.text.includes("28%") && !chunk.text.includes("12%"))).toBe(false);
  });

  it("does not join percentages that sit in separate paragraphs", () => {
    const text = [
      "We found that 28% of the documents contained minor factual errors.",
      "A later section says 12% of another sample failed.",
    ].join("\n");
    const chunks = evidenceChunker(text, 120);

    expect(chunks).toHaveLength(2);
    expect(chunks.every((chunk) => !passageSupportsClaim(ERROR_CLAIM, chunk.text, { documentKind: "html" }))).toBe(true);
  });

  it("rejoins a wrapped line without splitting the percentage sentence", () => {
    const text =
      "we found that 28% of\nthe documents contained minor factual errors, and 12% contained major factual errors.";
    const chunks = evidenceChunker(text, 120);

    expect(chunks).toHaveLength(1);
    expect(passageSupportsClaim(ERROR_CLAIM, chunks[0].text, { documentKind: "html" })).toBe(true);
  });

  it("groups consecutive sentences in one paragraph until the next sentence would pass 120 words", () => {
    const first = `${Array.from({ length: 70 }, (_, index) => `alpha${index}`).join(" ")}.`;
    const second = `${Array.from({ length: 40 }, (_, index) => `beta${index}`).join(" ")}.`;
    const third = `${Array.from({ length: 20 }, (_, index) => `gamma${index}`).join(" ")}.`;
    const chunks = evidenceChunker(`${first} ${second} ${third}`, 120);

    expect(chunks.map((chunk) => chunk.id)).toEqual(["chunk-1", "chunk-2"]);
    expect(chunks[0].text.startsWith("alpha0")).toBe(true);
    expect(chunks[0].text).toContain("beta0");
    expect(chunks[0].text).not.toContain("gamma0");
    expect(chunks[1].text.startsWith("gamma0")).toBe(true);
    expect(chunks.every((chunk) => chunk.wordCount <= 120)).toBe(true);
    expect(chunks.every((chunk) => chunk.wordCount === words(chunk.text).length)).toBe(true);
  });

  it("splits a sentence longer than 120 words without dropping or duplicating words", () => {
    const wordsInSentence = Array.from({ length: 125 }, (_, index) => `long${index}`);
    const sentence = `${wordsInSentence.join(" ")}.`;
    const chunks = evidenceChunker(sentence, 120);
    const recovered = chunks.flatMap((chunk) => words(chunk.text));

    expect(chunks.map((chunk) => chunk.wordCount)).toEqual([120, 5]);
    expect(recovered).toEqual(words(sentence));
    expect(chunks.every((chunk) => chunk.wordCount <= 120)).toBe(true);
    expect(new Set(recovered).size).toBe(recovered.length);
  });

  it("keeps the MIT wording mismatch and the three-token minimum unchanged", () => {
    expect(passageSupportsClaim(TIME_CLAIM, MIT_SENTENCE, { documentKind: "html" })).toBe(false);
    expect(
      passageSupportsClaim(
        "ChatGPT decreased the time it took workers to complete the tasks by 40 percent.",
        MIT_SENTENCE,
        { documentKind: "html" },
      ),
    ).toBe(true);
  });
});
