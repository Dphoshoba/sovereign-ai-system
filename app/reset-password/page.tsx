"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sessionValid, setSessionValid] = useState<boolean | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionValid(!!data.session)
    })
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    if (password.length < 12) {
      setError("Password must be at least 12 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    window.location.href = "/login?passwordReset=success"
  }

  if (sessionValid === false) {
    return (
      <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
        <h1>Reset Link Expired</h1>
        <div style={{ maxWidth: 420 }}>
          <p style={{ fontSize: 16, color: "#333", lineHeight: 1.6 }}>
            This password reset link is invalid or has expired.
            Please request a new password reset link.
          </p>
          <a href="/forgot-password" style={{ fontSize: 14, color: "#555" }}>
            Request a new reset link
          </a>
        </div>
      </main>
    )
  }

  if (sessionValid === null) {
    return (
      <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
        <p>Loading...</p>
      </main>
    )
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>Set New Password</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: 420, display: "grid", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#555" }}>
          Choose a new password. Minimum 12 characters.
        </p>

        <input
          type="password"
          placeholder="New password"
          required
          minLength={12}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Confirm new password"
          required
          minLength={12}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={inputStyle}
        />

        {error && (
          <p style={{ color: "#cc0000", fontSize: 14, margin: 0 }}>{error}</p>
        )}

        <button style={buttonStyle} disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </main>
  )
}

const inputStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 16,
}

const buttonStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  border: "none",
  background: "#111",
  color: "#fff",
  fontWeight: "bold",
}
