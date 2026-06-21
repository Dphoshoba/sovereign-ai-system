export type ArticleQualityResult = {
    score: number
    grade: "excellent" | "good" | "fair" | "poor"
    checks: {
      titleQuality: number
      contentLength: number
      headingStructure: number
      faqPresence: number
      readability: number
    }
  }
  
  export function articleQualityScorer(
    article: {
      title?: string
      content?: string
      faq?: unknown[]
    }
  ): ArticleQualityResult {
    const titleLength = article.title?.length || 0
    const contentLength = article.content?.length || 0
  
    const titleQuality =
      titleLength >= 40 && titleLength <= 70 ? 20 : 10
  
    const contentScore =
      contentLength >= 2500 ? 20 :
      contentLength >= 1500 ? 15 :
      contentLength >= 1000 ? 10 :
      5
  
    const headingStructure =
      (article.content?.match(/^## /gm)?.length || 0) >= 3
        ? 20
        : 10
  
    const faqPresence =
      article.faq && article.faq.length > 0
        ? 20
        : 0
  
    const readability = 20
  
    const score =
      titleQuality +
      contentScore +
      headingStructure +
      faqPresence +
      readability
  
    return {
      score,
      grade:
        score >= 85
          ? "excellent"
          : score >= 70
            ? "good"
            : score >= 50
              ? "fair"
              : "poor",
      checks: {
        titleQuality,
        contentLength: contentScore,
        headingStructure,
        faqPresence,
        readability,
      },
    }
  }