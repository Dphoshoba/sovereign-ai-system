"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function ContentOSPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [contentType, setContentType] = useState("short")
  const [pillar, setPillar] = useState("AI Sovereign Systems")

  async function loadData() {
    const res = await fetch("/api/content-os")
    const result = await res.json()
    if (result.ok) setData(result)
  }

  async function createItem() {
    if (!title.trim()) return

    setLoading(true)

    const res = await fetch("/api/content-os", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        contentType,
        channel: "youtube",
        pillar,
        status: "idea",
        priority: "high",
        cta: "Get the Sovereign AI Creator Blueprint at echoesandvisions.ai",
        tags: ["echoes-visions", "sovereign-intelligence"],
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to create content item")
      return
    }

    setTitle("")
    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const items = data?.items || []
  const subscribers = data?.subscribers || []

  const shorts = items.filter((i: any) => i.contentType === "short").length
  const longform = items.filter((i: any) => i.contentType === "long-form").length
  const newsletter = items.filter((i: any) => i.contentType === "newsletter").length
  const leadMagnets = items.filter((i: any) => i.contentType === "lead-magnet").length

  return (
    <PageShell
      eyebrow="YouTube-Led Ecosystem Cadence"
      title="Echoes & Visions Content Operating System"
      description="Plan YouTube videos, Shorts, newsletters, lead magnets, content pillars and audience growth around one flagship ecosystem."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Content Items" value={items.length} />
        <MetricCard label="Shorts" value={shorts} />
        <MetricCard label="Long-form" value={longform} />
        <MetricCard label="Newsletters" value={newsletter} />
        <MetricCard label="Lead Magnets" value={leadMagnets} />
        <MetricCard label="Subscribers" value={subscribers.length} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Create Content Item" eyebrow="Cadence builder">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Content title"
              style={inputStyle}
            />

            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              style={inputStyle}
            >
              <option value="short">YouTube Short</option>
              <option value="long-form">Long-form Video</option>
              <option value="newsletter">Newsletter</option>
              <option value="lead-magnet">Lead Magnet</option>
            </select>

            <select
              value={pillar}
              onChange={(e) => setPillar(e.target.value)}
              style={inputStyle}
            >
              <option>AI Sovereign Systems</option>
              <option>Creator Intelligence</option>
              <option>Ministry Intelligence</option>
              <option>Strategic Foresight</option>
            </select>

            <button disabled={loading} onClick={createItem} style={buttonStyle}>
              {loading ? "Creating..." : "Add to Content OS"}
            </button>
          </ExecutiveCard>

          <ExecutiveCard title="Newsletter Subscribers" eyebrow="Owned audience">
            <div style={{ display: "grid", gap: 12 }}>
              {subscribers.map((subscriber: any) => (
                <div key={subscriber.id} style={cardStyle}>
                  <StatusBadge status={subscriber.status} />
                  <h3>{subscriber.email}</h3>
                  <p style={{ color: "#666" }}>{subscriber.source}</p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Content Pipeline" eyebrow="Consistency beats intensity">
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((item: any) => (
              <div key={item.id} style={cardStyle}>
                <StatusBadge status={item.status} />
                <h3>{item.title}</h3>
                <p style={{ color: "#666" }}>
                  {item.contentType} · {item.channel} · {item.pillar}
                </p>
                <p>{item.cta}</p>
              </div>
            ))}
          </div>
        </ExecutiveCard>
      </div>
    </PageShell>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #ddd",
  padding: 12,
  marginBottom: 12,
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 16,
  padding: 18,
  background: "#fafafa",
}