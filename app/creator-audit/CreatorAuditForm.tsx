"use client"

import { useState } from "react"

export default function CreatorAuditForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    creatorType: "",
    niche: "",
    audienceSize: "",
    publishingFrequency: "",
    monetizationMethod: "",
    currentTools: "",
    biggestBottleneck: "",
    automationGoals: "",
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function submitAudit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setSuccess(false)

    const response = await fetch("/api/creator-audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to submit audit request")
      return
    }

    setSuccess(true)

    setForm({
      name: "",
      email: "",
      creatorType: "",
      niche: "",
      audienceSize: "",
      publishingFrequency: "",
      monetizationMethod: "",
      currentTools: "",
      biggestBottleneck: "",
      automationGoals: "",
    })
  }

  function update(field: string, value: string) {
    setForm({ ...form, [field]: value })
  }

  return (
    <form
      onSubmit={submitAudit}
      className="rounded-[2rem] bg-white p-8 text-neutral-950 shadow-2xl"
    >
      <h2 className="text-2xl font-black">Book Your Audit</h2>

      <div className="mt-6 grid gap-4">
        <input required className={input} placeholder="Name" value={form.name} onChange={(e) => update("name", e.target.value)} />
        <input required type="email" className={input} placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        <input className={input} placeholder="Creator Type" value={form.creatorType} onChange={(e) => update("creatorType", e.target.value)} />
        <input className={input} placeholder="Niche" value={form.niche} onChange={(e) => update("niche", e.target.value)} />
        <input className={input} placeholder="Audience Size" value={form.audienceSize} onChange={(e) => update("audienceSize", e.target.value)} />
        <input className={input} placeholder="Publishing Frequency" value={form.publishingFrequency} onChange={(e) => update("publishingFrequency", e.target.value)} />
        <input className={input} placeholder="Monetization Method" value={form.monetizationMethod} onChange={(e) => update("monetizationMethod", e.target.value)} />

        <textarea
          rows={3}
          className={input}
          placeholder="Current Tools"
          value={form.currentTools}
          onChange={(e) => update("currentTools", e.target.value)}
        />

        <textarea
          rows={4}
          className={input}
          placeholder="Biggest Bottleneck"
          value={form.biggestBottleneck}
          onChange={(e) => update("biggestBottleneck", e.target.value)}
        />

        <textarea
          rows={4}
          className={input}
          placeholder="Automation Goals"
          value={form.automationGoals}
          onChange={(e) => update("automationGoals", e.target.value)}
        />

        <button
          disabled={loading}
          className="rounded-full bg-neutral-950 px-6 py-4 font-bold text-white disabled:opacity-60"
        >
          {loading ? "Generating Audit..." : "Submit Audit Request"}
        </button>

        {success ? (
          <p className="rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">
            Your audit request has been received. Echoes & Visions will review
            your creator systems and prepare next steps.
          </p>
        ) : null}
      </div>
    </form>
  )
}

const input =
  "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none focus:border-indigo-500"