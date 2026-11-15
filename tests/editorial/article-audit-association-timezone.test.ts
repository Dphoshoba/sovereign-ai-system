/**
 * Timezone-process isolation for audit association recognition.
 *
 * Behaviour under test: current-audit recognition stays stable when Node's
 * process timezone changes, for PostgreSQL `timestamp without time zone`
 * values decoded like node-pg (local wall clock).
 *
 * Module under test: lib/research/article-audit-association.ts
 * Existing tests: tests/editorial/article-audit-association.test.ts
 * Worker: tests/editorial/article-audit-association-timezone-worker.ts
 *
 * User instruction (verbatim excerpt): "Add or update tests demonstrating:
 * 1. Current audit recognised under TZ=UTC.
 * 2. Current audit recognised under TZ=Australia/Adelaide.
 * 3. Current audit recognised under TZ=America/New_York."
 * and "Run timezone-sensitive tests in separate processes where necessary".
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const worker = path.join(
  __dirname,
  "article-audit-association-timezone-worker.ts",
);

function runInTimezone(tz: string) {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", worker],
    {
      env: { ...process.env, TZ: tz },
      encoding: "utf8",
      cwd: path.join(__dirname, "../.."),
    },
  );

  if (result.status !== 0) {
    throw new Error(
      `timezone worker failed for TZ=${tz}\n` +
        `stdout:\n${result.stdout}\n` +
        `stderr:\n${result.stderr}`,
    );
  }

  return JSON.parse(result.stdout) as {
    tz: string | null;
    currentAuditId: string | null;
    matched: boolean;
    wallIso: string;
    associationCreatedAt: string;
  };
}

describe("article audit associations across process timezones", () => {
  it.each(["UTC", "Australia/Adelaide", "America/New_York"] as const)(
    "recognises a pg-decoded current audit under TZ=%s",
    (tz) => {
      const payload = runInTimezone(tz);
      expect(payload.matched).toBe(true);
      expect(payload.currentAuditId).toBe("audit-current");
      expect(payload.wallIso).toBe(payload.associationCreatedAt);
      expect(payload.associationCreatedAt).toBe("2026-11-15T20:28:27.377Z");
    },
  );
});
