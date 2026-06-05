"use client"

import { useState } from "react"

export default function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const result = await res.json()

      if (!res.ok) {
        setMessage(result.error || `Something went wrong. Status: ${res.status}`)
        return
      }

      setEmail("")
      setMessage(
        result.alreadySubscribed
          ? "You're already subscribed."
          : "You are now subscribed to the Sovereign Intelligence Newsletter."
      )
    } catch {
      setMessage("Signup failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="rounded-2xl border border-black/15 px-5 py-4 outline-none"
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-2xl bg-black px-6 py-4 font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Joining..." : "Join Now"}
      </button>

      {message ? (
        <p className="text-sm text-black/60 md:col-span-2">
          {message}
        </p>
      ) : null}
    </form>
  )
}