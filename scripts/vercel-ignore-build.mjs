#!/usr/bin/env node
/**
 * Vercel Ignored Build Step helper (EV-OPS-02).
 * Exit 0 = skip build; exit 1 = continue build.
 *
 * Skips Production/Preview builds when every changed file is monitoring /
 * operations / workflow documentation — so placing the EV-OPS monitor
 * workflow on `main` cannot redeploy application code.
 *
 * Existing Production Branch remains `main`. This script must be present on
 * the commit being evaluated (require Director approval before merging to main).
 */
import { execSync } from "node:child_process"

const ALLOW_PREFIXES = [
  ".github/workflows/ev-ops-01-",
  ".github/workflows/ev-ops-02-",
  "ops/ev-ops-01/",
  "docs/operations/EV_OPS_",
  "tests/ops/ev-ops-",
  "scripts/vercel-ignore-build.mjs",
]

const ALLOW_EXACT = new Set([
  "vercel.json",
  ".gitignore",
  "docs/operations/EV_OPS_01_PRODUCTION_MONITORING.md",
  "docs/operations/EV_OPS_02_CLOUD_MONITORING_AND_ALERTS.md",
])

function changedFiles() {
  const prev = process.env.VERCEL_GIT_PREVIOUS_SHA
  const sha = process.env.VERCEL_GIT_COMMIT_SHA
  try {
    if (prev && sha && /^[0-9a-f]{7,40}$/i.test(prev) && /^[0-9a-f]{7,40}$/i.test(sha)) {
      const out = execSync(`git diff --name-only ${prev} ${sha}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      })
      return out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    }
  } catch {
    // fall through
  }
  // First deployment / missing previous SHA: never skip blindly on main.
  return null
}

function isAllowed(path) {
  if (ALLOW_EXACT.has(path)) return true
  return ALLOW_PREFIXES.some((p) => path.startsWith(p))
}

const ref = process.env.VERCEL_GIT_COMMIT_REF || ""
// Evidence branch may already be skipped by project Ignore Command; keep safe.
if (ref === "cursor/autonomous-pipeline-lockdown-1605") {
  console.log("[vercel-ignore-build] evidence branch — skip build")
  process.exit(0)
}

const files = changedFiles()
if (!files) {
  console.log("[vercel-ignore-build] no previous SHA — build")
  process.exit(1)
}
if (files.length === 0) {
  console.log("[vercel-ignore-build] empty diff — skip build")
  process.exit(0)
}

const blocked = files.filter((f) => !isAllowed(f))
if (blocked.length === 0) {
  console.log(
    `[vercel-ignore-build] ops/docs/workflow-only (${files.length} files) — skip build`,
  )
  process.exit(0)
}

console.log(
  `[vercel-ignore-build] application changes present (${blocked.slice(0, 8).join(", ")}) — build`,
)
process.exit(1)
