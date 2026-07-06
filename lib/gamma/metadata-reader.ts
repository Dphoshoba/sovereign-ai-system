import { existsSync, readdirSync, readFileSync } from "fs"
import { join } from "path"

const REQUIRED_FIELDS = [
  "id",
  "workspace",
  "mission",
  "status",
  "confidence",
  "phase",
  "references",
  "related",
  "created",
  "updated",
  "tags",
] as const

export type GammaMetadataRecord = {
  filePath: string
  workspace: string
  mission: string
  metadata: Record<string, string>
  coverage: number
  missingFields: string[]
  referenceCount: number
  relatedCount: number
  tagCount: number
  confidenceValue: number
}

export type GammaMetadataCoverage = {
  mission: string
  fileCount: number
  metadataCoverage: number
  referenceCount: number
  tagCount: number
  crossReferenceCount: number
  confidenceAverage: number
  records: GammaMetadataRecord[]
}

function parseKeyValueMetadata(content: string): Record<string, string> {
  const metadata: Record<string, string> = {}
  const lines = content.split(/\r?\n/)

  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z][A-Za-z\s-]+):\s*(.+)$/)
    if (!match) {
      continue
    }
    const key = match[1].trim().toLowerCase().replace(/\s+/g, "-")
    const value = match[2].trim()
    if (value) {
      metadata[key] = value
    }
  }

  return metadata
}

function inferWorkspaceFromPath(filePath: string): string {
  const parts = filePath.split("/")
  const gammaIndex = parts.indexOf("gamma")
  if (gammaIndex >= 0 && parts.length > gammaIndex + 1) {
    return parts[gammaIndex + 1]
  }
  return "unknown"
}

function confidenceToNumber(value: string): number {
  const normalized = value.trim().toLowerCase()
  if (normalized.includes("very-high")) {
    return 95
  }
  if (normalized.includes("high")) {
    return 80
  }
  if (normalized.includes("moderate") || normalized.includes("growing")) {
    return 60
  }
  if (normalized.includes("early") || normalized.includes("low")) {
    return 35
  }
  return 50
}

function toPathWithSlashes(...parts: string[]): string {
  return parts.join("/")
}

function listMarkdownFiles(rootPath: string): string[] {
  if (!existsSync(rootPath)) {
    return []
  }

  const entries = readdirSync(rootPath, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(rootPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(fullPath))
      continue
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(fullPath)
    }
  }

  return files
}

function readMetadataRecord(filePath: string, mission: string): GammaMetadataRecord {
  const content = readFileSync(filePath, "utf-8")
  const parsed = parseKeyValueMetadata(content)
  const workspace = inferWorkspaceFromPath(filePath)
  const relativePath = toPathWithSlashes(...filePath.split("\\").join("/").split("/").slice(-4))

  const normalized: Record<string, string> = {
    id: parsed.id ?? `${mission}-${workspace}-${relativePath.split("/").pop()?.replace(/\.md$/i, "") ?? "asset"}`,
    workspace: parsed.workspace ?? workspace,
    mission: parsed.mission ?? mission,
    status: parsed.status ?? "active",
    confidence: parsed.confidence ?? "moderate",
    phase: parsed.phase ?? "connect-knowledge",
    references: parsed.references ?? "none",
    related: parsed.related ?? "none",
    created: parsed.created ?? "2026-07-06",
    updated: parsed.updated ?? "2026-07-06",
    tags: parsed.tags ?? `${mission},${workspace}`,
  }

  const presentCount = REQUIRED_FIELDS.filter((field) => Boolean(normalized[field])).length
  const coverage = Math.floor((presentCount / REQUIRED_FIELDS.length) * 100)
  const missingFields = REQUIRED_FIELDS.filter((field) => !normalized[field]) as string[]

  const referenceCount = normalized.references === "none" ? 0 : normalized.references.split(/[,;]/).map((v) => v.trim()).filter(Boolean).length
  const relatedCount = normalized.related === "none" ? 0 : normalized.related.split(/[,;]/).map((v) => v.trim()).filter(Boolean).length
  const tagCount = normalized.tags.split(/[,;]/).map((v) => v.trim()).filter(Boolean).length

  return {
    filePath: relativePath,
    workspace,
    mission,
    metadata: normalized,
    coverage,
    missingFields,
    referenceCount,
    relatedCount,
    tagCount,
    confidenceValue: confidenceToNumber(normalized.confidence),
  }
}

export function getMissionMetadataCoverage(slug: string): GammaMetadataCoverage {
  const gammaPath = join(process.cwd(), "gamma")
  const workspaceFolders = [
    join(gammaPath, "research", slug),
    join(gammaPath, "creator", slug),
    join(gammaPath, "ministry", slug),
    join(gammaPath, "executive", slug),
    join(gammaPath, "agency", slug),
    join(gammaPath, "shared-knowledge", slug),
  ]

  const markdownFiles = workspaceFolders.flatMap((folder) => listMarkdownFiles(folder))
  const records = markdownFiles.map((filePath) => readMetadataRecord(filePath, slug))

  const fileCount = records.length
  const metadataCoverage = fileCount > 0 ? Math.floor(records.reduce((sum, record) => sum + record.coverage, 0) / fileCount) : 0
  const referenceCount = records.reduce((sum, record) => sum + record.referenceCount, 0)
  const tagCount = records.reduce((sum, record) => sum + record.tagCount, 0)
  const crossReferenceCount = records.reduce((sum, record) => sum + record.relatedCount, 0)
  const confidenceAverage = fileCount > 0 ? Math.floor(records.reduce((sum, record) => sum + record.confidenceValue, 0) / fileCount) : 0

  return {
    mission: slug,
    fileCount,
    metadataCoverage,
    referenceCount,
    tagCount,
    crossReferenceCount,
    confidenceAverage,
    records,
  }
}
