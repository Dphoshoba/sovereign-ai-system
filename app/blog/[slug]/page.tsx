import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { prisma } from "@/lib/prisma"

function appUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  )

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }

  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
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
  const { slug } = await params

  const article = await prisma.article.findFirst({
    where: { slug, status: "published" },
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
  })

  return (
    <main style={{ fontFamily: "Arial, sans-serif", background: "#fafafa" }}>
      <article style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <Link href="/blog" style={backLink}>
          ← Back to Blog
        </Link>

        {article.featuredImage ? (
          <img
            src={article.featuredImage}
            alt={article.title}
            style={{
              width: "100%",
              maxHeight: 430,
              objectFit: "cover",
              borderRadius: 22,
              margin: "28px 0",
            }}
          />
        ) : null}

        <p style={metaStyle}>
          {article.category} · {formatDate(article.createdAt)}
        </p>

        <h1 style={{ fontSize: "48px", lineHeight: 1.05, margin: "18px 0" }}>
          {article.title}
        </h1>

        {article.excerpt ? (
          <p style={{ fontSize: "21px", color: "#555", lineHeight: 1.65 }}>
            {article.excerpt}
          </p>
        ) : null}

        <div style={articleBox}>
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {article.content || "No content yet."}
            </ReactMarkdown>
          </div>
        </div>

        {relatedArticles.length > 0 ? (
          <section style={relatedSection}>
            <p style={metaStyle}>Recommended Reading</p>
            <h2 style={{ fontSize: 30, marginTop: 8 }}>Related Articles</h2>

            <div style={{ display: "grid", gap: 18, marginTop: 22 }}>
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  style={relatedCard}
                >
                  <p style={metaStyle}>{related.category}</p>
                  <h3 style={{ margin: "8px 0", fontSize: 22 }}>
                    {related.title}
                  </h3>
                  <p style={{ color: "#555", lineHeight: 1.6 }}>
                    {related.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section style={ctaStyle}>
          <p style={{ textTransform: "uppercase", letterSpacing: 2, color: "#aaa" }}>
            Echoes & Visions
          </p>

          <h2 style={{ fontSize: 30, marginBottom: 12 }}>
            Want this kind of AI system built for your work?
          </h2>

          <p style={{ color: "#ddd", lineHeight: 1.7, maxWidth: 680 }}>
            We help creators, founders, ministries, and businesses build
            practical AI automation systems that save time, protect voice, and
            support real growth.
          </p>

          <a href="/contact" style={ctaButton}>
            Book a Strategy Session →
          </a>
        </section>
      </article>
    </main>
  )
}

const backLink: React.CSSProperties = {
  color: "#111",
  fontWeight: "bold",
  textDecoration: "none",
}

const metaStyle: React.CSSProperties = {
  color: "#777",
  fontSize: 14,
  textTransform: "uppercase",
  letterSpacing: 1,
}

const articleBox: React.CSSProperties = {
  background: "#fff",
  borderRadius: 22,
  border: "1px solid #e5e5e5",
  padding: "36px",
  marginTop: 34,
  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
}

const relatedSection: React.CSSProperties = {
  marginTop: 46,
  padding: 30,
  borderRadius: 22,
  background: "#fff",
  border: "1px solid #e5e5e5",
}

const relatedCard: React.CSSProperties = {
  display: "block",
  padding: 22,
  borderRadius: 16,
  border: "1px solid #eee",
  background: "#fafafa",
  color: "#111",
  textDecoration: "none",
}

const ctaStyle: React.CSSProperties = {
  marginTop: 46,
  padding: 34,
  borderRadius: 22,
  background: "#111",
  color: "#fff",
}

const ctaButton: React.CSSProperties = {
  display: "inline-block",
  marginTop: 16,
  padding: "12px 18px",
  borderRadius: 10,
  background: "#fff",
  color: "#111",
  textDecoration: "none",
  fontWeight: "bold",
}