"use client"

import { useState } from "react"

export default function StarterPackForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    creatorType: "",
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      const response = await fetch("/api/creator-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      const result = await response.json()

      if (!result.ok) {
        alert(result.error || "Failed to save lead")
        return
      }

      setSuccess(true)

      setForm({
        name: "",
        email: "",
        creatorType: "",
      })
    } catch (error) {
      console.error(error)
      alert("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-white p-8 shadow-xl"
    >
      <input
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="mb-4 w-full rounded-xl border p-3"
        placeholder="Name"
      />

      <input
        required
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="mb-4 w-full rounded-xl border p-3"
        placeholder="Email"
      />

      <input
        value={form.creatorType}
        onChange={(e) => setForm({ ...form, creatorType: e.target.value })}
        className="mb-4 w-full rounded-xl border p-3"
        placeholder="Creator Type"
      />

      <button
        disabled={loading}
        className="w-full rounded-full bg-neutral-950 px-6 py-3 font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Download The Starter Pack"}
      </button>

      {success ? (
  <div className="mt-4">
    <p className="text-sm font-semibold text-green-600">
      Success. Your Starter Pack is ready.
    </p>

    <a
      href="/downloads/creator-automation-starter-pack.pdf"
      download
      className="mt-4 block rounded-full bg-indigo-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-indigo-700"
    >
      Download Your Starter Pack
    </a>
  </div>
) : null}
    </form>
  )
}