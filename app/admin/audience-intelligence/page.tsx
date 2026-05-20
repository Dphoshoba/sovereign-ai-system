"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function AudienceIntelligencePage() {
  const [data, setData] = useState<any>(null)

  async function loadData() {
    const res = await fetch("/api/audience-intelligence")
    const result = await res.json()

    if (result.ok) {
      setData(result)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const profiles = data?.profiles || []
  const subscribers = data?.subscribers || []
  const topicSignals = data?.topicSignals || []

  return (
    <PageShell
      eyebrow="Relationship Intelligence Runtime"
      title="Audience Intelligence Layer"
      description="Track ecosystem relationships, audience trust, resonance, segmentation, and conversion intelligence."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Audience Profiles" value={profiles.length} />
        <MetricCard label="Subscribers" value={subscribers.length} />
        <MetricCard label="Topic Signals" value={topicSignals.length} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard
            title="Audience Profiles"
            eyebrow="Community intelligence"
          >
            <div style={{ display: "grid", gap: 12 }}>
              {profiles.map((profile: any) => (
                <div key={profile.id} style={cardStyle}>
                  <StatusBadge status={profile.relationshipStage} />

                  <h3>{profile.email || "Anonymous"}</h3>

                  <p>
                    {profile.audienceType} · Trust {profile.trustScore}/100
                  </p>

                  <p>
                    Engagement {profile.engagementScore}/100 · Resonance{" "}
                    {profile.resonanceScore}/100
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard
            title="Newsletter Subscribers"
            eyebrow="Owned audience"
          >
            <div style={{ display: "grid", gap: 12 }}>
              {subscribers.map((subscriber: any) => (
                <div key={subscriber.id} style={cardStyle}>
                  <StatusBadge status={subscriber.status} />
                  <h3>{subscriber.email}</h3>
                  <p>{subscriber.source}</p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>
    </PageShell>
  )
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 16,
  padding: 18,
  background: "#fafafa",
}