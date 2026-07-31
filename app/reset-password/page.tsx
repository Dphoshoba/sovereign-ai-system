"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [stage, setStage] = useState<"enter-code" | "set-password">("enter-code")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    if (!email || !recoveryCode) {
      setError("Email and recovery code are required.")
      return
    }

    setLoading(true)

    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: recoveryCode,
      type: "recovery",
    })

    setLoading(false)

    if (err) {
      if (err.message.includes("expired") || err.message.includes("Expired")) {
        setError("This recovery code has expired. Please request a new one.")
      } else if (err.message.includes("not found") || err.message.includes("NotFound")) {
        setError("Invalid recovery code. Please check and try again.")
      } else if (err.message.includes("rate") || err.message.includes("Rate")) {
        setError("Too many attempts. Please wait and try again.")
      } else {
        setError("Unable to verify code. Please check your email and code, then try again.")
      }
      return
    }

    setStage("set-password")
  }

  async function handleSetPassword(event: React.FormEvent) {
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

  if (stage === "enter-code") {
    return (
      <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
        <h1>Reset Password</h1>

        <form onSubmit={handleVerifyCode} style={{ maxWidth: 420, display: "grid", gap: 16 }}>
          <p style={{ fontSize: 14, color: "#555" }}>
            Enter the email address you requested recovery for and the code sent to your inbox.
          </p>

          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Recovery code"
            required
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
            style={inputStyle}
          />

          {error && (
            <p style={{ color: "#cc0000", fontSize: 14, margin: 0 }}>{error}</p>
          )}

          <button style={buttonStyle} disabled={loading}>
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </form>
      </main>
    )
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>Set New Password</h1>

      <form onSubmit={handleSetPassword} style={{ maxWidth: 420, display: "grid", gap: 16 }}>
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
  padding: 12, borderRadius: 8, border: "1px solid #ccc", fontSize: 16,
}

const buttonStyle: React.CSSProperties = {
  padding: 12, borderRadius: 8, border: "none", background: "#111", color: "#fff", fontWeight: "bold",
}
