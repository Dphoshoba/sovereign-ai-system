import type { ReactNode } from "react"

export default function ExecutiveCard({
  title,
  eyebrow,
  children,
}: {
  title?: string
  eyebrow?: string
  children: ReactNode
}) {
  return (
    <section style={cardStyle}>
      {eyebrow ? <p style={eyebrowStyle}>{eyebrow}</p> : null}
      {title ? <h2 style={titleStyle}>{title}</h2> : null}
      {children}
    </section>
  )
}

const cardStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const eyebrowStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1.5,
  color: "var(--muted)",
  fontSize: 12,
  margin: 0,
}

const titleStyle: React.CSSProperties = {
  marginTop: 6,
}