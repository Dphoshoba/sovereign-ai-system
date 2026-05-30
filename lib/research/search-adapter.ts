import type { SourceRecord } from "./source-collector"

export async function searchAdapter(
  topic: string
): Promise<SourceRecord[]> {
  const provider = process.env.SEARCH_PROVIDER || "none"

  if (provider === "none") {
    return []
  }

  return []
}
