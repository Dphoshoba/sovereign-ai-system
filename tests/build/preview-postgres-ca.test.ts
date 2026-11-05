import { readFileSync } from "node:fs"
import path from "node:path"
import { X509Certificate } from "node:crypto"
import { parse } from "pg-connection-string"
import { describe, expect, it } from "vitest"
import {
  SUPABASE_ROOT_CA_FINGERPRINT,
  databaseUrlForRuntime,
  previewDatabaseUrl,
  supabaseRootCaPath,
} from "../../src/lib/preview-postgres"

const repoRoot = path.resolve(__dirname, "../..")
const previewUrl =
  "postgresql://postgres.example:preview-test-password@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"

describe("preview PostgreSQL CA packaging", () => {
  it("stores the official Supabase root certificate without a private key", () => {
    const pem = readFileSync(supabaseRootCaPath(repoRoot), "utf8")
    expect(pem).toContain("BEGIN CERTIFICATE")
    expect(pem).not.toContain("PRIVATE KEY")
    const fingerprint = new X509Certificate(pem).fingerprint256
      .replace(/:/g, "")
      .toUpperCase()
    expect(fingerprint).toBe(SUPABASE_ROOT_CA_FINGERPRINT)
  })

  it("leaves non-preview connection strings unchanged", () => {
    const productionUrl =
      "postgresql://postgres.example:preview-test-password@db.kqptdgbttfuqkzxzbazw.supabase.co:5432/postgres"
    expect(databaseUrlForRuntime(productionUrl, {}, repoRoot)).toBe(productionUrl)
    expect(
      databaseUrlForRuntime(productionUrl, { VERCEL_ENV: "production" }, repoRoot),
    ).toBe(productionUrl)
    expect(databaseUrlForRuntime(undefined, { VERCEL_ENV: "production" }, repoRoot)).toBe(
      undefined,
    )
  })

  it("points Preview at the packaged certificate and verifies the full chain", () => {
    const resolved = new URL(previewDatabaseUrl(previewUrl, repoRoot))
    expect(resolved.searchParams.get("sslmode")).toBe("verify-full")
    expect(resolved.searchParams.get("sslrootcert")).toBe(supabaseRootCaPath(repoRoot))
    expect(resolved.hostname).toBe("aws-0-ap-southeast-2.pooler.supabase.com")
    expect(resolved.port).toBe("5432")

    const parsed = parse(resolved.toString())
    expect(parsed.ssl).toMatchObject({
      ca: readFileSync(supabaseRootCaPath(repoRoot), "utf8"),
    })
    expect(parsed.ssl).not.toMatchObject({ rejectUnauthorized: false })
  })

  it("fails closed when Preview would reach Production or skip verification", () => {
    expect(() =>
      previewDatabaseUrl(
        "postgresql://postgres.example:preview-test-password@db.kqptdgbttfuqkzxzbazw.supabase.co:5432/postgres",
        repoRoot,
      ),
    ).toThrow(/Production Supabase project/)

    expect(() =>
      previewDatabaseUrl(`${previewUrl}?sslmode=no-verify`, repoRoot),
    ).toThrow(/disables certificate verification/)

    expect(() => previewDatabaseUrl(previewUrl, path.join(repoRoot, "missing"))).toThrow(
      /certificate is unavailable/,
    )
  })
})
