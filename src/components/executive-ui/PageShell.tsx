import type { ReactNode } from "react"

export default function PageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>{eyebrow}</p>
        <h1 style={titleStyle}>{title}</h1>
        {description ? <p style={descriptionStyle}>{description}</p> : null}
      </section>

      <div style={{ marginTop: 28 }}>{children}</div>
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  padding: 40,
  fontFamily: "Arial, sans-serif",
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

const titleStyle: React.CSSProperties = {
  fontSize: 42,
  margin: "8px 0",
}

const descriptionStyle: React.CSSProperties = {
  color: "var(--hero-muted)",
  maxWidth: 880,
  lineHeight: 1.7,
}