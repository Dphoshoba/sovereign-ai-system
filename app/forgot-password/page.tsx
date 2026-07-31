"use client"

import { useState } from "react"
import Link from "next/link"
import { createBrowserClient } from "@supabase/ssr"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")

    const { error: err } = await supabase.auth.resetPasswordForEmail(email)

    setLoading(false)

    if (err) {
      setError("Unable to process request. Please try again.")
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
        <h1>Check Your Email</h1>
        <div style={{ maxWidth: 420 }}>
          <p style={{ fontSize: 16, color: "#333", lineHeight: 1.6 }}>
            If an account exists for that email address, a recovery code has been sent.
            Please check your inbox, copy the code, and proceed to the reset page.
          </p>
          <Link href="/reset-password" style={{ display: "inline-block", marginTop: 16, fontSize: 14, color: "#555" }}>
            Enter your recovery code
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>Forgot Password</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: 420, display: "grid", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#555" }}>
          Enter your email address and we will send you a recovery code.
        </p>

        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        {error && (
          <p style={{ color: "#cc0000", fontSize: 14, margin: 0 }}>{error}</p>
        )}

        <button style={buttonStyle} disabled={loading}>
          {loading ? "Sending..." : "Send Recovery Code"}
        </button>

        <Link href="/login" style={{ textAlign: "center", fontSize: 14, color: "#555" }}>
          Back to login
        </Link>
      </form>
    </main>
  )
}

const inputStyle: React.CSSProperties = {
  padding: 12, borderRadius: 8, border: "1px solid #ccc", fontSize: 16,
}

const buttonStyle: React.CSSProperties = {
  padding: 12, borderRadius: 8, border: "none", background: "#111", color: "#fff", fontWeight: "bold",
}
