import { describe, expect, it } from "vitest";
import { classifyConsensusTheme } from "../../lib/research/consensus-engine";
import { DELOITTE_SURVEY_PASSAGE } from "../fixtures/research-audit/article-2";
import {
  BIBLEPROJECT_SAUL_ARC_CLAIM,
  SAMUEL_GUIDE_FAILURE_CLAIM,
  SCRIPTURE_ARMIES_CLAIM,
} from "../fixtures/research-audit/article-3";

describe("consensus theme classification", () => {
  it("does not treat war as a match inside warning or warns", () => {
    expect(classifyConsensusTheme("The warning describes a privacy limitation.")).toBe(
      "Ethics and Responsibility",
    );
    expect(classifyConsensusTheme(BIBLEPROJECT_SAUL_ARC_CLAIM)).not.toBe("Conflict");
    expect(classifyConsensusTheme(SAMUEL_GUIDE_FAILURE_CLAIM)).not.toBe("Conflict");
    expect(classifyConsensusTheme(DELOITTE_SURVEY_PASSAGE)).not.toBe("Conflict");
  });

  it("still matches the ordinary word war", () => {
    expect(classifyConsensusTheme("The armies met in war and the battle continued.")).toBe(
      "Conflict",
    );
  });

  it("keeps an explicit stem such as generat and produc", () => {
    expect(
      classifyConsensusTheme("Generative tools can draft a paragraph for later review."),
    ).toBe("Content Production");
    expect(classifyConsensusTheme("The team will generate a short script.")).toBe(
      "Content Production",
    );
    expect(classifyConsensusTheme(DELOITTE_SURVEY_PASSAGE)).toBe("Content Production");
  });

  it("matches ordinary keywords on word boundaries in the Article 3 fixtures", () => {
    expect(classifyConsensusTheme("A personal decision requires reflection.")).toBe(
      "Personal Growth",
    );
    expect(classifyConsensusTheme(SCRIPTURE_ARMIES_CLAIM)).toBe("Leadership");
    expect(classifyConsensusTheme(BIBLEPROJECT_SAUL_ARC_CLAIM)).toBe("Leadership");
  });
});
