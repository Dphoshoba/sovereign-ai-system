"use client"

import { useEffect, useState } from "react"

type TrendItem = {
  current: number
  previous: number
  change: number
}

type TrendResponse = {
  trends: {
    articlesPublished: TrendItem
    socialPublished: TrendItem
    newslettersSent: TrendItem
    subscribers: TrendItem
  } | null
}

export default function GrowthTrends() {
  const [data, setData] = useState<TrendResponse | null>(null)

  useEffect(() => {
    fetch("/api/reports/growth-trends")
      .then((res) => res.json())
      .then(setData)
  }, [])

  if (!data?.trends) {
    return null
  }

  const rows = [
    ["Articles", data.trends.articlesPublished],
    ["Social Posts", data.trends.socialPublished],
    ["Newsletters", data.trends.newslettersSent],
    ["Subscribers", data.trends.subscribers],
  ] as const

  return (
    <section style={cardStyle}>
      <h2>Growth Trend Analysis</h2>

      {rows.map(([label, trend]) => (
        <div key={label} style={rowStyle}>
          <strong>{label}</strong>
          <span>
            {trend.previous} → {trend.current} ({trend.change >= 0 ? "+" : ""}
            {trend.change}%)
          </span>
        </div>
      ))}
    </section>
  )
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "20px",
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  padding: "8px 0",
  borderBottom: "1px solid #eee",
}