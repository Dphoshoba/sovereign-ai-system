"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createBrowserClient } from "@supabase/ssr"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("passwordReset") === "success") {
      setPasswordResetSuccess(true)
    }
  }, [])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    window.location.href = "/admin/articles"
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>Echoes & Visions Admin Login</h1>

      {passwordResetSuccess && (
        <div style={{ maxWidth: 420, padding: "12px 16px", background: "#e8f5e9", borderRadius: 8, marginBottom: 16, color: "#2e7d32", fontSize: 14 }}>
          Your password has been changed successfully. Please sign in with your new password.
        </div>
      )}

      <form onSubmit={handleLogin} style={{ maxWidth: 420, display: "grid", gap: 16 }}>
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button style={buttonStyle} disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>

        <Link href="/forgot-password" style={{ textAlign: "center", fontSize: 14, color: "#555" }}>
          Forgot password?
        </Link>
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