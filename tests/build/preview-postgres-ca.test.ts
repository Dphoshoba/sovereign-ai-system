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
const previewPassword = "preview-test-password"
const previewUrl =
  `postgresql://postgres.emmzoeeaznhpwevqprkn:${previewPassword}@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`

function previewUrlWith(changes: {
  username?: string
  host?: string
  port?: string
  database?: string
  query?: string
}) {
  const username = changes.username ?? "postgres.emmzoeeaznhpwevqprkn"
  const host = changes.host ?? "aws-0-ap-southeast-2.pooler.supabase.com"
  const port = changes.port ?? "5432"
  const database = changes.database ?? "postgres"
  const query = changes.query ? `?${changes.query}` : ""
  return `postgresql://${username}:${previewPassword}@${host}:${port}/${database}${query}`
}

function expectClosed(url: string, pattern: RegExp) {
  expect(() => previewDatabaseUrl(url, repoRoot)).toThrow(pattern)
  try {
    previewDatabaseUrl(url, repoRoot)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    expect(message).not.toContain(previewPassword)
    expect(message).not.toContain("postgresql://")
  }
}

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

  it("leaves Production and Development connection strings unchanged", () => {
    const productionUrl =
      "postgresql://postgres.example:preview-test-password@db.kqptdgbttfuqkzxzbazw.supabase.co:5432/postgres"
    const developmentUrl = previewUrlWith({ host: "127.0.0.1", port: "5433", database: "app" })
    expect(databaseUrlForRuntime(productionUrl, {}, repoRoot)).toBe(productionUrl)
    expect(
      databaseUrlForRuntime(productionUrl, { VERCEL_ENV: "production" }, repoRoot),
    ).toBe(productionUrl)
    expect(databaseUrlForRuntime(undefined, { VERCEL_ENV: "production" }, repoRoot)).toBe(
      undefined,
    )
    expect(
      databaseUrlForRuntime(developmentUrl, { VERCEL_ENV: "development" }, repoRoot),
    ).toBe(developmentUrl)
    expect(databaseUrlForRuntime(undefined, { VERCEL_ENV: "development" }, repoRoot)).toBe(
      undefined,
    )
  })

  it("points Preview at the packaged certificate and verifies the full chain", () => {
    const resolved = new URL(previewDatabaseUrl(previewUrl, repoRoot))
    expect(resolved.searchParams.get("sslmode")).toBe("verify-full")
    expect(resolved.searchParams.get("sslrootcert")).toBe(supabaseRootCaPath(repoRoot))
    expect(resolved.hostname).toBe("aws-0-ap-southeast-2.pooler.supabase.com")
    expect(resolved.port).toBe("5432")
    expect(decodeURIComponent(resolved.username)).toBe("postgres.emmzoeeaznhpwevqprkn")
    expect(resolved.pathname).toBe("/postgres")
    expect(databaseUrlForRuntime(previewUrl, { VERCEL_ENV: "preview" }, repoRoot)).toBe(
      resolved.toString(),
    )

    const parsed = parse(resolved.toString())
    expect(parsed.ssl).toMatchObject({
      ca: readFileSync(supabaseRootCaPath(repoRoot), "utf8"),
    })
    expect(parsed.ssl).not.toMatchObject({ rejectUnauthorized: false })
  })

  it("fails closed when Preview would reach Production or skip verification", () => {
    expectClosed(
      `postgresql://postgres.example:${previewPassword}@db.kqptdgbttfuqkzxzbazw.supabase.co:5432/postgres`,
      /Production Supabase project/,
    )
    expectClosed(
      previewUrlWith({ username: "postgres.kqptdgbttfuqkzxzbazw" }),
      /Production Supabase project/,
    )
    expectClosed(previewUrlWith({ query: "sslmode=no-verify" }), /disables certificate verification/)
    expectClosed(previewUrlWith({ query: "sslmode=disable" }), /disables certificate verification/)

    expect(() => previewDatabaseUrl(previewUrl, path.join(repoRoot, "missing"))).toThrow(
      /certificate is unavailable/,
    )
  })

  it("accepts only the approved Preview session pooler", () => {
    expectClosed(previewUrlWith({ username: "postgres.notpreviewproject" }), /username is not approved/)
    expectClosed(
      previewUrlWith({ host: "db.emmzoeeaznhpwevqprkn.supabase.co" }),
      /host is not approved/,
    )
    expectClosed(previewUrlWith({ port: "6543" }), /port is not approved/)
    expectClosed(previewUrlWith({ database: "template1" }), /database is not approved/)
  })

  it("fails closed for a missing or malformed Preview URL without revealing it", () => {
    expect(() => databaseUrlForRuntime(undefined, { VERCEL_ENV: "preview" }, repoRoot)).toThrow(
      /DATABASE_URL is missing/,
    )
    expect(() => databaseUrlForRuntime("", { VERCEL_ENV: "preview" }, repoRoot)).toThrow(
      /DATABASE_URL is missing/,
    )
    expectClosed(
      `postgresql://postgres.emmzoeeaznhpwevqprkn:${previewPassword}@`,
      /DATABASE_URL is invalid/,
    )
    expectClosed("not a database url", /DATABASE_URL is invalid/)
  })
})
