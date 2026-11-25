import { describe, expect, it } from "vitest";
import {
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  auditCreatedAtMatchesAssociation,
  parseArticleAuditAssociation,
  partitionAssociatedArticleAudits,
  serializeArticleAuditAssociation,
  utcIsoFromTimestampWithoutTimezone,
} from "../../lib/research/article-audit-association";
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint";
import {
  CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
  VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION,
  isCurrentResearchAuditEngineRevision,
} from "../../lib/research/research-audit-engine-revision";

/** Simulate node-pg decoding of a `timestamp without time zone` wall clock. */
function pgTimestampWithoutTimezone(wallIsoZ: string): Date {
  const match = wallIsoZ.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/,
  );
  if (!match) throw new Error(`invalid wall iso: ${wallIsoZ}`);
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
    Number(match[7]),
  );
}

const article = {
  id: "article-1",
  title: "AI as infrastructure",
  excerpt: "A governed operating layer.",
  content: "Evidence-backed body.",
  category: "ai-tools",
  seoTitle: "AI infrastructure",
  seoDescription: "Build governed AI workflows.",
  seoKeywords: "AI infrastructure, governance",
};

const sources = ["https://www.nist.gov/itl/ai-risk-management-framework"];
const fingerprint = computeArticleAuditFingerprint(article, sources);
const DEFAULT_WALL = "2026-09-15T00:00:00.000Z";

/**
 * Build a fingerprint note whose createdAt is the naive wall ISO (UTC-written
 * Production shape). Pair with `auditRecord` / `pgTimestampWithoutTimezone`.
 */
function associationNote(
  auditId: string,
  value = fingerprint,
  wallIso = DEFAULT_WALL,
  engineRevision: string = CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
) {
  return {
    action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
    note: JSON.stringify({
      version: 2,
      auditId,
      contentFingerprint: value,
      algorithm: "sha256",
      createdAt: wallIso,
      engineRevision,
    }),
  };
}

function auditRecord(id: string, wallIso = DEFAULT_WALL) {
  return {
    id,
    articleId: article.id,
    createdAt: pgTimestampWithoutTimezone(wallIso),
  };
}

describe("article audit associations", () => {
  it("round-trips the strict machine-readable payload", () => {
    expect(
      parseArticleAuditAssociation(associationNote("audit-current")),
    ).toEqual({
      version: 2,
      auditId: "audit-current",
      contentFingerprint: fingerprint,
      algorithm: "sha256",
      createdAt: "2026-09-15T00:00:00.000Z",
      engineRevision: CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
    });
  });

  it.each([
    ["malformed JSON", "not-json"],
    ["missing key", JSON.stringify({ version: 2 })],
    [
      "extra key",
      JSON.stringify({
        version: 2,
        auditId: "audit-current",
        contentFingerprint: fingerprint,
        algorithm: "sha256",
        createdAt: "2026-09-15T00:00:00.000Z",
        engineRevision: CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
        extra: true,
      }),
    ],
    [
      "wrong algorithm",
      JSON.stringify({
        version: 2,
        auditId: "audit-current",
        contentFingerprint: fingerprint,
        algorithm: "sha1",
        createdAt: "2026-09-15T00:00:00.000Z",
        engineRevision: CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
      }),
    ],
    [
      "wrong version",
      JSON.stringify({
        version: 3,
        auditId: "audit-current",
        contentFingerprint: fingerprint,
        algorithm: "sha256",
        createdAt: "2026-09-15T00:00:00.000Z",
        engineRevision: CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
      }),
    ],
    [
      "legacy v1 payload",
      JSON.stringify({
        version: 1,
        auditId: "audit-current",
        contentFingerprint: fingerprint,
        algorithm: "sha256",
        createdAt: "2026-09-15T00:00:00.000Z",
      }),
    ],
    [
      "blank audit ID",
      JSON.stringify({
        version: 2,
        auditId: " ",
        contentFingerprint: fingerprint,
        algorithm: "sha256",
        createdAt: "2026-09-15T00:00:00.000Z",
        engineRevision: CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
      }),
    ],
    [
      "invalid fingerprint",
      JSON.stringify({
        version: 2,
        auditId: "audit-current",
        contentFingerprint: "not-a-sha256",
        algorithm: "sha256",
        createdAt: "2026-09-15T00:00:00.000Z",
        engineRevision: CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
      }),
    ],
    [
      "invalid timestamp",
      JSON.stringify({
        version: 2,
        auditId: "audit-current",
        contentFingerprint: fingerprint,
        algorithm: "sha256",
        createdAt: "yesterday",
        engineRevision: CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
      }),
    ],
    [
      "invalid engine revision",
      JSON.stringify({
        version: 2,
        auditId: "audit-current",
        contentFingerprint: fingerprint,
        algorithm: "sha256",
        createdAt: "2026-09-15T00:00:00.000Z",
        engineRevision: "Legacy Chrome",
      }),
    ],
  ])("rejects %s as historical", (_label, note) => {
    expect(
      parseArticleAuditAssociation({
        action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
        note,
      }),
    ).toBeNull();
  });

  it("ignores ordinary human review notes", () => {
    expect(
      parseArticleAuditAssociation({
        action: "approved",
        note: associationNote("audit-current").note,
      }),
    ).toBeNull();
  });

  it("selects only the audit whose ID and fingerprint both match", () => {
    const current = auditRecord("audit-current", "2026-09-15T00:00:00.000Z");
    const stale = auditRecord("audit-stale", "2026-09-14T00:00:00.000Z");
    const legacy = auditRecord("audit-legacy", "2026-09-13T00:00:00.000Z");

    expect(
      partitionAssociatedArticleAudits(
        article,
        sources,
        [stale, current, legacy],
        [
          associationNote("audit-stale", "a".repeat(64)),
          associationNote("wrong-audit"),
          associationNote("audit-stale"),
          associationNote("audit-current"),
        ],
      ),
    ).toEqual({
      current,
      historical: [stale, legacy],
    });
  });

  it("treats legacy audits and wrong-audit associations as historical", () => {
    const legacy = auditRecord("audit-legacy", "2026-09-13T00:00:00.000Z");
    expect(
      partitionAssociatedArticleAudits(
        article,
        sources,
        [legacy],
        [associationNote("missing-audit")],
      ),
    ).toEqual({ current: null, historical: [legacy] });
  });

  it("rejects an audit associated to another article", () => {
    const foreignAudit = {
      id: "audit-foreign",
      articleId: "article-2",
      createdAt: pgTimestampWithoutTimezone("2026-09-15T00:00:00.000Z"),
    };

    expect(
      partitionAssociatedArticleAudits(
        article,
        sources,
        [foreignAudit],
        [associationNote(foreignAudit.id)],
      ),
    ).toEqual({ current: null, historical: [foreignAudit] });
  });

  it("does not let a newer unmatched audit hide a valid matching audit", () => {
    const matching = auditRecord("audit-matching", "2026-09-14T00:00:00.000Z");
    const newerUnrelated = auditRecord("audit-newer", "2026-09-15T00:00:00.000Z");

    expect(
      partitionAssociatedArticleAudits(
        article,
        sources,
        [matching, newerUnrelated],
        [associationNote(matching.id, fingerprint, "2026-09-14T00:00:00.000Z")],
      ),
    ).toEqual({ current: matching, historical: [newerUnrelated] });
  });

  it("does not let a newer malformed association hide a valid matching audit", () => {
    const matching = auditRecord("audit-matching", "2026-09-14T00:00:00.000Z");
    const newer = auditRecord("audit-newer", "2026-09-15T00:00:00.000Z");

    expect(
      partitionAssociatedArticleAudits(
        article,
        sources,
        [matching, newer],
        [
          associationNote(matching.id, fingerprint, "2026-09-14T00:00:00.000Z"),
          {
            action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
            note: "not-json",
          },
        ],
      ),
    ).toEqual({ current: matching, historical: [newer] });
  });

  it("rejects an association timestamp that differs from its audit", () => {
    const audit = auditRecord("audit-current", "2026-09-15T00:00:00.000Z");

    expect(
      partitionAssociatedArticleAudits(article, sources, [audit], [
        associationNote(
          audit.id,
          fingerprint,
          "2026-09-15T00:00:00.001Z",
        ),
      ]),
    ).toEqual({ current: null, historical: [audit] });
  });

  it("keeps an older engine revision historical when the fingerprint still matches", () => {
    const obsoleteWall = "2026-09-16T12:27:51.423Z";
    const replacementWall = "2026-09-16T13:00:00.000Z";
    const obsolete = auditRecord("audit-obsolete", obsoleteWall);
    const replacement = auditRecord("audit-current-engine", replacementWall);

    expect(
      partitionAssociatedArticleAudits(
        article,
        sources,
        [obsolete, replacement],
        [
          associationNote(
            obsolete.id,
            fingerprint,
            obsoleteWall,
            "legacy-chrome-v0",
          ),
          associationNote(replacement.id, fingerprint, replacementWall),
        ],
      ),
    ).toEqual({
      current: replacement,
      historical: [obsolete],
    });
  });

  it("treats article-grounded-v3 as historical once article-grounded-v4 is current", () => {
    const obsoleteWall = "2026-09-17T19:13:36.500Z";
    const replacementWall = "2026-09-18T00:00:00.000Z";
    const obsolete = auditRecord("audit-v3", obsoleteWall);
    const replacement = auditRecord("audit-v4", replacementWall);

    expect(
      partitionAssociatedArticleAudits(
        article,
        sources,
        [obsolete, replacement],
        [
          associationNote(
            obsolete.id,
            fingerprint,
            obsoleteWall,
            "article-grounded-v3",
          ),
          associationNote(replacement.id, fingerprint, replacementWall),
        ],
      ),
    ).toEqual({
      current: replacement,
      historical: [obsolete],
    });

    expect(
      partitionAssociatedArticleAudits(article, sources, [obsolete], [
        associationNote(
          obsolete.id,
          fingerprint,
          obsoleteWall,
          "article-grounded-v3",
        ),
      ]),
    ).toEqual({ current: null, historical: [obsolete] });
  });

  it("treats article-grounded-v5 as historical once article-grounded-v6 is current", () => {
    const obsoleteWall = "2026-09-22T06:30:57.453Z";
    const replacementWall = "2026-09-22T07:00:00.000Z";
    const obsolete = auditRecord("audit-v5", obsoleteWall);
    const replacement = auditRecord("audit-v6", replacementWall);

    expect(
      partitionAssociatedArticleAudits(
        article,
        sources,
        [obsolete, replacement],
        [
          associationNote(
            obsolete.id,
            fingerprint,
            obsoleteWall,
            "article-grounded-v5",
          ),
          associationNote(replacement.id, fingerprint, replacementWall),
        ],
      ),
    ).toEqual({
      current: replacement,
      historical: [obsolete],
    });

    expect(
      partitionAssociatedArticleAudits(article, sources, [obsolete], [
        associationNote(
          obsolete.id,
          fingerprint,
          obsoleteWall,
          "article-grounded-v5",
        ),
      ]),
    ).toEqual({ current: null, historical: [obsolete] });
  });

  it("treats article-grounded-v6 as historical under the current revision", () => {
    const obsoleteWall = "2026-11-01T09:57:12.977Z";
    const replacementWall = "2026-11-01T10:30:00.000Z";
    const obsolete = auditRecord("audit-v6", obsoleteWall);
    const replacement = auditRecord("audit-v7", replacementWall);

    expect(
      partitionAssociatedArticleAudits(
        article,
        sources,
        [obsolete, replacement],
        [
          associationNote(
            obsolete.id,
            fingerprint,
            obsoleteWall,
            "article-grounded-v6",
          ),
          associationNote(replacement.id, fingerprint, replacementWall),
        ],
      ),
    ).toEqual({
      current: replacement,
      historical: [obsolete],
    });

    expect(
      partitionAssociatedArticleAudits(article, sources, [obsolete], [
        associationNote(
          obsolete.id,
          fingerprint,
          obsoleteWall,
          "article-grounded-v6",
        ),
      ]),
    ).toEqual({ current: null, historical: [obsolete] });
  });

  it("keeps an article-grounded-v7 note readable and historical once article-grounded-v14 is current", () => {
    const historicalWall = "2026-11-02T20:34:25.561Z";
    const currentWall = "2026-11-03T00:00:00.000Z";
    const historical = auditRecord("audit-v7", historicalWall);
    const current = auditRecord("audit-v8", currentWall);
    const historicalNote = associationNote(
      historical.id,
      fingerprint,
      historicalWall,
      "article-grounded-v7",
    ).note;
    const parsed = parseArticleAuditAssociation({
      action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
      note: historicalNote,
    });

    expect(parsed).toMatchObject({
      version: 2,
      auditId: historical.id,
      contentFingerprint: fingerprint,
      algorithm: "sha256",
      engineRevision: "article-grounded-v7",
    });
    expect(Object.keys(JSON.parse(historicalNote!)).sort()).toEqual([
      "algorithm",
      "auditId",
      "contentFingerprint",
      "createdAt",
      "engineRevision",
      "version",
    ]);
    expect(
      partitionAssociatedArticleAudits(
        article,
        sources,
        [historical, current],
        [
          {
            action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
            note: historicalNote,
          },
          associationNote(current.id, fingerprint, currentWall),
        ],
      ),
    ).toEqual({
      current,
      historical: [historical],
    });
    expect(
      partitionAssociatedArticleAudits(article, sources, [historical], [
        {
          action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
          note: historicalNote,
        },
      ]),
    ).toEqual({ current: null, historical: [historical] });
    expect(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION).toBe("article-grounded-v14");
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v13")).toBe(false);
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v12")).toBe(false);
    expect(
      partitionAssociatedArticleAudits(article, sources, [historical], [
        associationNote(
          historical.id,
          fingerprint,
          historicalWall,
          "article-grounded-v10",
        ),
      ]),
    ).toEqual({ current: null, historical: [historical] });
    expect(
      partitionAssociatedArticleAudits(article, sources, [historical], [
        associationNote(
          historical.id,
          fingerprint,
          historicalWall,
          "article-grounded-v9",
        ),
      ]),
    ).toEqual({ current: null, historical: [historical] });
    expect(
      partitionAssociatedArticleAudits(article, sources, [historical], [
        associationNote(
          historical.id,
          fingerprint,
          historicalWall,
          "article-grounded-v11",
        ),
      ]),
    ).toEqual({ current: null, historical: [historical] });
  });

  it("recovers PostgreSQL naive wall clocks without using getUTC*", () => {
    const wall = "2026-11-15T20:28:27.377Z";
    const decoded = pgTimestampWithoutTimezone(wall);
    expect(utcIsoFromTimestampWithoutTimezone(decoded)).toBe(wall);
    expect(auditCreatedAtMatchesAssociation(decoded, wall)).toBe(true);
    expect(
      auditCreatedAtMatchesAssociation("2026-11-15 20:28:27.377", wall),
    ).toBe(true);
  });

  it("recognises a UTC-written association against a pg-decoded audit Date", () => {
    const wall = "2026-11-15T20:28:27.377Z";
    const current = {
      id: "audit-pg-decoded",
      articleId: article.id,
      createdAt: pgTimestampWithoutTimezone(wall),
    };

    expect(
      partitionAssociatedArticleAudits(article, sources, [current], [
        {
          action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
          note: JSON.stringify({
            version: 2,
            auditId: current.id,
            contentFingerprint: fingerprint,
            algorithm: "sha256",
            createdAt: wall,
            engineRevision: VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION,
          }),
        },
      ]),
    ).toEqual({ current, historical: [] });
  });

  it("rejects incorrect audit id, fingerprint, and verifier revision for pg-decoded audits", () => {
    const wall = "2026-11-15T20:28:27.377Z";
    const current = {
      id: "audit-pg-decoded",
      articleId: article.id,
      createdAt: pgTimestampWithoutTimezone(wall),
    };
    const baseNote = {
      version: 2,
      auditId: current.id,
      contentFingerprint: fingerprint,
      algorithm: "sha256",
      createdAt: wall,
      engineRevision: VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION,
    };

    expect(
      partitionAssociatedArticleAudits(article, sources, [current], [
        {
          action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
          note: JSON.stringify({ ...baseNote, auditId: "wrong-id" }),
        },
      ]),
    ).toEqual({ current: null, historical: [current] });

    expect(
      partitionAssociatedArticleAudits(article, sources, [current], [
        {
          action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
          note: JSON.stringify({
            ...baseNote,
            contentFingerprint: "b".repeat(64),
          }),
        },
      ]),
    ).toEqual({ current: null, historical: [current] });

    expect(
      partitionAssociatedArticleAudits(article, sources, [current], [
        {
          action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
          note: JSON.stringify({
            ...baseNote,
            engineRevision: "article-grounded-v7",
          }),
        },
      ]),
    ).toEqual({ current: null, historical: [current] });
  });

  it("keeps a matching UTC-written association compatible alongside historical audits", () => {
    const historicalWall = "2026-06-24T00:13:56.167Z";
    const currentWall = "2026-11-15T20:28:27.377Z";
    const historical = auditRecord("audit-historical", historicalWall);
    const current = auditRecord("audit-current-utc", currentWall);

    expect(
      partitionAssociatedArticleAudits(
        article,
        sources,
        [historical, current],
        [
          associationNote(historical.id, fingerprint, historicalWall),
          associationNote(current.id, fingerprint, currentWall),
        ],
      ),
    ).toEqual({ current, historical: [historical] });
  });

  it("rejects an absolute ISO that only matches via the alternate wall interpretation", () => {
    // Under Australia/Adelaide (+10:30), absolute 09:58:27.377Z displays as
    // local wall 20:28:27.377. Wall-only binding must not also accept the
    // absolute ISO as a second valid association timestamp for that Date.
    const absolute = new Date("2026-11-15T09:58:27.377Z");
    const absoluteIso = absolute.toISOString();
    const wallIso = utcIsoFromTimestampWithoutTimezone(absolute);
    expect(wallIso).not.toBeNull();

    if (absoluteIso === wallIso) {
      // UTC process: absolute and wall coincide — dual-interpretation hazard
      // cannot appear. Still require exact single-path wall equality.
      expect(auditCreatedAtMatchesAssociation(absolute, absoluteIso)).toBe(true);
      return;
    }

    expect(auditCreatedAtMatchesAssociation(absolute, wallIso!)).toBe(true);
    expect(auditCreatedAtMatchesAssociation(absolute, absoluteIso)).toBe(false);
  });

  it("round-trips serializeArticleAuditAssociation under the write-path ISO shape", () => {
    const createdAt = pgTimestampWithoutTimezone("2026-09-15T00:00:00.000Z");
    const note = serializeArticleAuditAssociation({
      auditId: "audit-serialize",
      contentFingerprint: fingerprint,
      createdAt,
    });
    expect(parseArticleAuditAssociation({
      action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
      note,
    })).toMatchObject({
      auditId: "audit-serialize",
      createdAt: "2026-09-15T00:00:00.000Z",
      engineRevision: CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
    });
  });
});
