import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { X509Certificate } from "node:crypto"

export const SUPABASE_ROOT_CA_FINGERPRINT =
  "807025AD50D4ED219D2C9C7D299C004F824EB00CF7F65AFEF607D07B72E6CAFA"

export const SUPABASE_ROOT_CA_RELATIVE_PATH = path.join(
  "certs",
  "supabase-root-2021.crt",
)

const PRODUCTION_SUPABASE_PROJECT_REF = "kqptdgbttfuqkzxzbazw"

export function supabaseRootCaPath(cwd = process.cwd()) {
  return path.resolve(cwd, SUPABASE_ROOT_CA_RELATIVE_PATH)
}

export function databaseUrlForRuntime(
  databaseUrl: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
) {
  if (env.VERCEL_ENV !== "preview") return databaseUrl
  if (!databaseUrl) {
    throw new Error("Preview DATABASE_URL is missing")
  }
  return previewDatabaseUrl(databaseUrl, cwd)
}

export function previewDatabaseUrl(databaseUrl: string, cwd = process.cwd()) {
  if (databaseUrl.includes(PRODUCTION_SUPABASE_PROJECT_REF)) {
    throw new Error(
      "Preview DATABASE_URL references the Production Supabase project",
    )
  }

  const caPath = supabaseRootCaPath(cwd)
  if (!existsSync(caPath)) {
    throw new Error("Preview PostgreSQL CA certificate is unavailable")
  }

  const pem = readFileSync(caPath, "utf8")
  if (pem.includes("PRIVATE KEY") || !pem.includes("BEGIN CERTIFICATE")) {
    throw new Error("Preview PostgreSQL CA certificate is invalid")
  }

  const fingerprint = new X509Certificate(pem).fingerprint256
    .replace(/:/g, "")
    .toUpperCase()
  if (fingerprint !== SUPABASE_ROOT_CA_FINGERPRINT) {
    throw new Error(
      "Preview PostgreSQL CA certificate fingerprint does not match",
    )
  }

  let url: URL
  try {
    url = new URL(databaseUrl)
  } catch {
    throw new Error("Preview DATABASE_URL is invalid")
  }

  const sslmode = url.searchParams.get("sslmode")
  if (sslmode === "disable" || sslmode === "no-verify") {
    throw new Error("Preview DATABASE_URL disables certificate verification")
  }

  url.searchParams.set("sslmode", "verify-full")
  url.searchParams.set("sslrootcert", caPath)
  return url.toString()
}
