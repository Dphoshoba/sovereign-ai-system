export type SeoScoreResult = {
    score: number
    grade: "excellent" | "good" | "fair" | "poor"
    checks: {
      seoTitle: number
      seoDescription: number
      keywords: number
      titleLength: number
      descriptionLength: number
    }
  }
  
  export function seoScorer(article: {
    seoTitle?: string
    seoDescription?: string
    seoKeywords?: string
  }) : SeoScoreResult {
  
    const titleLength =
      article.seoTitle?.length || 0
  
    const descriptionLength =
      article.seoDescription?.length || 0
  
    const seoTitle =
      titleLength >= 40 && titleLength <= 65
        ? 20
        : 10
  
    const seoDescription =
      descriptionLength >= 120 &&
      descriptionLength <= 160
        ? 20
        : 10
  
    const keywords =
      article.seoKeywords &&
      article.seoKeywords.split(",").length >= 3
        ? 20
        : 10
  
    const titleScore = 20
    const descriptionScore = 20
  
    const score =
      seoTitle +
      seoDescription +
      keywords +
      titleScore +
      descriptionScore
  
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
        seoTitle,
        seoDescription,
        keywords,
        titleLength: titleScore,
        descriptionLength: descriptionScore,
      },
    }
  }