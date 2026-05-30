import { contentCleaner } from "./content-cleaner"

export type FetchedContent = {
  title: string
  url: string
  extractedText: string
  fetchStatus: string
}

export async function contentFetcher(
  url: string,
  title: string
): Promise<FetchedContent> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "EchoesVisionsResearchBot/1.0",
      },
    })

    const html = await response.text()

    const rawText = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    const text = contentCleaner(rawText)

    return {
      title,
      url,
      extractedText: text,
      fetchStatus: "success",
    }
  } catch (error) {
    return {
      title,
      url,
      extractedText: "",
      fetchStatus: "failed",
    }
  }
}
