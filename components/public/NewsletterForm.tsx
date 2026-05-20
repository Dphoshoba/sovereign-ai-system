"use client"

import { useState } from "react"

export default function NewsletterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        setName("")
        setEmail("")
      }
    } catch (error) {
      console.error(error)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-2xl border border-black/10 px-5 py-4 outline-none"
        required
      />

      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-2xl border border-black/10 px-5 py-4 outline-none"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-black px-6 py-4 font-semibold text-white"
      >
        {loading ? "Joining..." : "Join the Network"}
      </button>

      {success && (
        <p className="text-green-600">
          Welcome to Sovereign AI.
        </p>
      )}
    </form>
  )
}