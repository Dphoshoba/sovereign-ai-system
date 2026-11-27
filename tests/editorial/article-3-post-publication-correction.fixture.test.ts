import { describe, expect, it } from "vitest";
import {
  ARTICLE_3_SAMUEL_17_32_AFTER,
  ARTICLE_3_SAMUEL_17_32_ALIGNED,
  ARTICLE_3_SAMUEL_17_32_BEFORE,
  ARTICLE_3_SAMUEL_17_32_EVIDENCE,
} from "./fixtures/article-3-17-32-correction";

describe("Article 3 post-publication correction fixture", () => {
  it("records the 1 Samuel 17:32 wording change and its evidence URL", () => {
    expect(ARTICLE_3_SAMUEL_17_32_BEFORE).toBe(
      "According to 1 Samuel 17:32, David says that his servant will go and fight with this Philistine.",
    );
    expect(ARTICLE_3_SAMUEL_17_32_AFTER).toBe(
      "According to 1 Samuel 17:32, David volunteers to go and fight the Philistine.",
    );
    expect(ARTICLE_3_SAMUEL_17_32_EVIDENCE).toBe(
      "https://www.biblegateway.com/passage/?search=1%20Samuel%2017%3A32&version=KJV",
    );
    expect(ARTICLE_3_SAMUEL_17_32_AFTER).not.toContain("his servant will go");
    expect(ARTICLE_3_SAMUEL_17_32_ALIGNED).toBe(
      'According to 1 Samuel 17:32, David tells Saul, “Thy servant will go and fight with this Philistine.”',
    );
  });
});
