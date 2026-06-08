"use client"

import { useState } from "react"

export function NewsletterSignup() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email) {
      setMessage("Please enter your email.")
      return
    }

    setLoading(true)
    setMessage("")

    const response = await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })

    const result = await response.json()
    console.log("Newsletter subscribe response:", result)

    if (!response.ok) {
      setMessage(result.error || `Something went wrong. Status: ${response.status}`)
      setLoading(false)
      return
    }

    setEmail("")
    setMessage(
      result.alreadySubscribed
        ? "You're already subscribed."
        : "You're subscribed. Welcome to Echoes & Visions."
    )

    setLoading(false)
  }

  return (
    <section style={boxStyle}>
      <h2>Join the Echoes & Visions Newsletter</h2>
      <p>
        Practical insights on AI automation, creativity, ministry, and building
        wise systems that serve people.
      </p>

      <form onSubmit={subscribe} style={formStyle}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={inputStyle}
        />

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Subscribing..." : "Subscribe"}
        </button>
      </form>

      {message && <p style={{ marginTop: "12px" }}>{message}</p>}
    </section>
  )
}

const boxStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "16px",
  padding: "24px",
  marginTop: "32px",
}

const formStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "16px",
}

const inputStyle: React.CSSProperties = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  minWidth: "260px",
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: "8px",
  border: "none",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  fontWeight: "bold",
  cursor: "pointer",
}
