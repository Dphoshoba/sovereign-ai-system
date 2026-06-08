"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type ExecutiveRecommendation = {
  title: string
  reason: string
  suggestedAction: string
  priority: "urgent" | "high" | "medium" | "low"
  link?: string
}

type RecommendationsPayload = {
  urgent: ExecutiveRecommendation[]
  today: ExecutiveRecommendation[]
  thisWeek: ExecutiveRecommendation[]
  growth: ExecutiveRecommendation[]
  revenue: ExecutiveRecommendation[]
  delivery: ExecutiveRecommendation[]
  content: ExecutiveRecommendation[]
}

const SECTIONS: {
  key: keyof RecommendationsPayload
  title: string
  description: string
}[] = [
  {
    key: "urgent",
    title: "Urgent",
    description: "Items that need immediate attention today.",
  },
  {
    key: "today",
    title: "Today",
    description: "High-impact actions to complete now.",
  },
  {
    key: "thisWeek",
    title: "This Week",
    description: "Important work to schedule over the next few days.",
  },
  {
    key: "growth",
    title: "Growth",
    description: "Audience and subscriber expansion opportunities.",
  },
  {
    key: "revenue",
    title: "Revenue",
    description: "Pipeline and payment actions to increase income.",
  },
  {
    key: "delivery",
    title: "Delivery",
    description: "Client project and task priorities.",
  },
  {
    key: "content",
    title: "Content",
    description: "Publishing pipeline and editorial actions.",
  },
]

export default function ExecutiveRecommendationsPage() {
  const [recommendations, setRecommendations] =
    useState<RecommendationsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRecommendations() {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/executive/recommendations", {
        cache: "no-store",
      })
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to load recommendations")
        return
      }

      setRecommendations(result.recommendations)
    }

    loadRecommendations()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Executive Recommendations
        </h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Action engine powered by live platform data — what to do next across
          content, growth, revenue, and delivery.
        </p>
        <div style={linkRowStyle}>
          <Link href="/admin/executive-overview" style={linkStyle}>
            ← Executive Overview
          </Link>
          <Link href="/admin/operations" style={linkStyle}>
            Operations Center
          </Link>
        </div>
      </section>

      {loading && <p style={{ marginTop: 28 }}>Loading recommendations...</p>}

      {error && (
        <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>
      )}

      {recommendations &&
        SECTIONS.map((section) => {
          const items = recommendations[section.key]

          return (
            <section key={section.key} style={sectionStyle}>
              <h2>{section.title}</h2>
              <p style={sectionDescriptionStyle}>{section.description}</p>

              {items.length === 0 ? (
                <p style={emptyStyle}>No recommendations in this section.</p>
              ) : (
                <div style={cardGridStyle}>
                  {items.map((item) => (
                    <article key={`${section.key}-${item.title}`} style={cardStyle}>
                      <p style={priorityStyle(item.priority)}>
                        {item.priority.toUpperCase()}
                      </p>
                      <h3 style={{ marginTop: 0 }}>{item.title}</h3>
                      <p>
                        <strong>Reason:</strong> {item.reason}
                      </p>
                      <p>
                        <strong>Suggested action:</strong> {item.suggestedAction}
                      </p>
                      {item.link ? (
                        <Link href={item.link} style={actionLinkStyle}>
                          Open related page →
                        </Link>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )
        })}
    </main>
  )
}

function priorityStyle(priority: ExecutiveRecommendation["priority"]) {
  const colors: Record<ExecutiveRecommendation["priority"], string> = {
    urgent: "#b91c1c",
    high: "#c2410c",
    medium: "#92400e",
    low: "var(--muted)",
  }

  return {
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    fontSize: 12,
    color: colors[priority],
    margin: "0 0 8px",
    fontWeight: 700,
  }
}

const heroStyle: React.CSSProperties = {
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  borderRadius: 24,
  padding: 34,
}

const eyebrowStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--muted)",
  margin: 0,
}

const linkRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 20,
  flexWrap: "wrap",
  marginTop: 16,
}

const linkStyle: React.CSSProperties = {
  color: "var(--button-foreground)",
  fontWeight: 600,
}

const sectionStyle: React.CSSProperties = {
  marginTop: 32,
}

const sectionDescriptionStyle: React.CSSProperties = {
  color: "var(--muted)",
  marginTop: 0,
}

const cardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
  marginTop: 16,
}

const cardStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const emptyStyle: React.CSSProperties = {
  color: "var(--muted)",
}

const actionLinkStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: 12,
  fontWeight: 600,
  color: "var(--foreground)",
}
