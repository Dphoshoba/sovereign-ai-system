import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { connection } from "next/server"
import { prisma } from "@/lib/prisma"
import { PublishedArticleView } from "@/components/blog/PublishedArticleView"

function appUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  )

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }

  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  const article = await prisma.article.findFirst({
    where: {
      slug,
      status: "published",
    },
  })

  if (!article) {
    return {
      title: "Article Not Found | Echoes & Visions",
    }
  }

  const imageUrl = article.featuredImage
    ? appUrl(article.featuredImage)
    : appUrl("/og-default.jpg")

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
    alternates: {
      canonical: `/blog/${slug}`,
    },
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt || "",
    keywords: article.seoKeywords || "",
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt || "",
      images: [imageUrl],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt || "",
      images: [imageUrl],
    },
  }
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  await connection()

  const { slug } = await params

  const article = await prisma.article.findFirst({
    where: { slug, status: "published" },
    include: {
      researchSources: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!article) notFound()

  const relatedArticles = await prisma.article.findMany({
    where: {
      status: "published",
      category: article.category,
      id: { not: article.id },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      category: true,
    },
  })

  return (
    <PublishedArticleView
      article={article}
      researchSources={article.researchSources}
      relatedArticles={relatedArticles}
    />
  )
}
