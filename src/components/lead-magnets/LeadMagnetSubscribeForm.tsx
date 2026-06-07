"use client"

import { useState } from "react"

export function LeadMagnetSubscribeForm({
  leadMagnetId,
  fileUrl,
}: {
  leadMagnetId: string
  fileUrl: string | null
}) {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email) {
      setMessage("Please enter your email.")
      return
    }

    setLoading(true)
    setMessage("")

    const response = await fetch("/api/lead-magnets/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        leadMagnetId,
        source: "lead-magnet",
      }),
    })

    const result = await response.json()

    setLoading(false)

    if (!response.ok) {
      setMessage(result.error || "Something went wrong.")
      return
    }

    setSuccess(true)
    setMessage("Success. Your guide is ready.")
  }

  return (
    <div style={{ marginTop: "24px" }}>
      {!success ? (
        <form onSubmit={submitForm} style={formStyle}>
          <input
            type="email"
            value={email}
            placeholder="Enter your email"
            onChange={(event) => setEmail(event.target.value)}
            style={inputStyle}
          />

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Preparing..." : "Get the Free Guide"}
          </button>
        </form>
      ) : (
        <div style={successBoxStyle}>
          <p>{message}</p>

          {fileUrl ? (
            <a href={fileUrl} target="_blank" rel="noreferrer" style={buttonStyle}>
              Download Guide
            </a>
          ) : (
            <p>
              Download file is not attached yet. You have been added to the
              subscriber list.
            </p>
          )}
        </div>
      )}

      {message && !success && <p>{message}</p>}
    </div>
  )
}

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
  marginTop: "16px",
}

const inputStyle: React.CSSProperties = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "16px",
}

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "12px 16px",
  borderRadius: "8px",
  border: "none",
  background: "#111",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
  textAlign: "center",
}

const successBoxStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "18px",
  background: "#f8fafc",
}
