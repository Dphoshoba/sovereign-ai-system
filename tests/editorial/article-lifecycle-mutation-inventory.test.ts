import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const RUNTIME_ROOTS = [
  "app/api/articles",
  "app/api/ai/generate-article",
  "app/api/ai/autonomous-pipeline",
  "app/api/ai/generate-featured-image",
  "app/api/pipeline",
  "app/api/planning/create-draft",
  "app/api/workers/weekly-planner",
  "app/api/publishing",
  "lib/publishing",
  "lib/research",
  "lib/ai",
];

const ALLOWED_DIRECT_ARTICLE_UPDATE = [
  "lib/publishing/article-lifecycle.ts",
  "lib/research/prepare-article-for-review.ts",
  "lib/research/article-source-mutation.ts",
];

const ALLOWED_DIRECT_SOURCE_MUTATION = [
  "lib/research/article-source-mutation.ts",
];

function listRuntimeFiles(): string[] {
  const files: string[] = [];
  const visit = (relativePath: string) => {
    const absolute = join(process.cwd(), relativePath);
    const stats = statSync(absolute);
    if (stats.isFile()) {
      if (relativePath.endsWith(".ts") || relativePath.endsWith(".tsx")) {
        files.push(relativePath.replaceAll("\\", "/"));
      }
      return;
    }
    for (const entry of readdirSync(absolute)) {
      if (entry === "node_modules") continue;
      visit(join(relativePath, entry));
    }
  };
  for (const root of RUNTIME_ROOTS) visit(root);
  return files;
}

describe("article lifecycle and research-source mutation inventory", () => {
  const files = listRuntimeFiles();

  it("keeps Article updates inside the canonical locked services", () => {
    const offenders = files.filter((file) => {
      if (ALLOWED_DIRECT_ARTICLE_UPDATE.includes(file)) return false;
      const source = read(file);
      return /(?:prisma|tx)\.article\.update(Many)?\s*\(/.test(source);
    });
    expect(offenders).toEqual([]);
  });

  it("keeps ResearchSource writes inside the canonical source mutation service", () => {
    const offenders = files.filter((file) => {
      if (ALLOWED_DIRECT_SOURCE_MUTATION.includes(file)) return false;
      const source = read(file);
      return /researchSource\.(create|update|delete|deleteMany|upsert|createMany)\s*\(/.test(
        source,
      );
    });
    expect(offenders).toEqual([]);
  });

  it("does not recreate articles as published, scheduled, approved, rejected or archived", () => {
    const creationFiles = files.filter((file) =>
      /article\.create\s*\(/.test(read(file)),
    );
    for (const file of creationFiles) {
      const source = read(file);
      expect(source).not.toMatch(/status:\s*["']published["']/);
      expect(source).not.toMatch(/status:\s*["']scheduled["']/);
      expect(source).not.toMatch(/status:\s*["']approved["']/);
      expect(source).not.toMatch(/status:\s*["']rejected["']/);
      expect(source).not.toMatch(/status:\s*["']archived["']/);
    }
  });
});
