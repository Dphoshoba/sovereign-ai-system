"use client"

import Link from "next/link"

export default function AutonomousPipelinePage() {
  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>Autonomous Publishing Pipeline</h1>

      <p style={{ maxWidth: 780, color: "var(--muted)", lineHeight: 1.7 }}>
        This packaging entry point is locked down. It previously created articles
        without research or audit. Use the AI Generator instead — that path runs
        research and audit preparation, then stops at human review before
        featured-image, publish, or social steps.
      </p>

      <p style={{ marginTop: 24 }}>
        <Link href="/admin/ai-generator" style={linkStyle}>
          Open AI Generator
        </Link>
      </p>
    </main>
  )
}

const linkStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "12px 18px",
  borderRadius: 10,
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  fontWeight: "bold",
  textDecoration: "none",
}
