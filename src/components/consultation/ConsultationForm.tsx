"use client"

import { useState } from "react"

export default function ConsultationForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    creatorType: "",
    notes: "",
  })

  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  function updateField(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    })
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage("")

    const response = await fetch("/api/creator-leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    })

    const result = await response.json()

    setLoading(false)

    if (!response.ok) {
      setMessage(result.error || "Something went wrong.")
      return
    }

    if (result.alreadyExists) {
      setMessage("You are already in our consultation list. We will follow up.")
      return
    }

    setMessage("Success. Your consultation request has been received.")

    setForm({
      name: "",
      email: "",
      creatorType: "",
      notes: "",
    })
  }

  return (
    <form onSubmit={submitForm} style={formStyle}>
      <input
        name="name"
        placeholder="Your name"
        value={form.name}
        onChange={updateField}
        style={inputStyle}
        required
      />

      <input
        name="email"
        type="email"
        placeholder="Your email"
        value={form.email}
        onChange={updateField}
        style={inputStyle}
        required
      />

      <input
        name="creatorType"
        placeholder="Creator, ministry, business, founder, church..."
        value={form.creatorType}
        onChange={updateField}
        style={inputStyle}
      />

      <textarea
        name="notes"
        placeholder="What do you need help with?"
        value={form.notes}
        onChange={updateField}
        style={textareaStyle}
      />

      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? "Sending..." : "Request Consultation"}
      </button>

      {message && <p>{message}</p>}
    </form>
  )
}

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: "14px",
  marginTop: "28px",
}

const inputStyle: React.CSSProperties = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  fontSize: "16px",
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "140px",
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "8px",
  border: "none",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  fontWeight: "bold",
  cursor: "pointer",
}