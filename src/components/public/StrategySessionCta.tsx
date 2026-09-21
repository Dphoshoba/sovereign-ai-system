import type { CSSProperties } from "react"

export const STRATEGY_SESSION_HREF = "/consultation"
export const STRATEGY_SESSION_LABEL = "Book a Strategy Session →"

const sectionStyle: CSSProperties = {
  marginTop: 0,
  padding: 34,
  borderRadius: 22,
  background: "#111",
  color: "#fff",
}

const buttonStyle: CSSProperties = {
  display: "inline-block",
  marginTop: 16,
  padding: "12px 18px",
  borderRadius: 10,
  background: "#fff",
  color: "#111",
  textDecoration: "none",
  fontWeight: "bold",
}

export function StrategySessionCta() {
  return (
    <section data-strategy-cta="true" style={sectionStyle}>
      <p
        style={{
          textTransform: "uppercase",
          letterSpacing: 2,
          color: "#aaa",
        }}
      >
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

      <a href={STRATEGY_SESSION_HREF} style={buttonStyle}>
        {STRATEGY_SESSION_LABEL}
      </a>
    </section>
  )
}
