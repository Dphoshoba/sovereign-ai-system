"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LeadMagnetForm() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [fileUrl, setFileUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setMessage("")

    const response = await fetch("/api/lead-magnets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        fileUrl: fileUrl || undefined,
      }),
    })

    const result = await response.json()
    setLoading(false)

    if (!response.ok) {
      setMessage(result.error || "Failed to create lead magnet")
      return
    }

    setTitle("")
    setDescription("")
    setFileUrl("")
    setMessage("Lead magnet created successfully.")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h2>Create Lead Magnet</h2>

      <label style={labelStyle}>
        Title
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
          rows={4}
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        File URL (optional)
        <input
          type="url"
          value={fileUrl}
          onChange={(event) => setFileUrl(event.target.value)}
          style={inputStyle}
        />
      </label>

      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? "Creating..." : "Create Lead Magnet"}
      </button>

      {message && <p style={{ marginTop: "12px" }}>{message}</p>}
    </form>
  )
}

const formStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "20px",
  display: "grid",
  gap: "12px",
  marginBottom: "24px",
}

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: "6px",
  fontWeight: "bold",
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  fontFamily: "inherit",
}

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  fontWeight: "bold",
  cursor: "pointer",
  width: "fit-content",
}
