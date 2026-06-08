"use client"

import { useEffect, useState } from "react"

type AiJob = {
  id: string
  type: string
  status: string
  attempts: number
  error: string | null
  createdAt: string
  scheduledAt: string
  completedAt: string | null
}

export default function AiJobsPage() {
  const [jobs, setJobs] = useState<AiJob[]>([])
  const [loading, setLoading] = useState(false)

  async function loadJobs() {
    const response = await fetch("/api/ai/jobs")
    const result = await response.json()

    if (result.ok) {
      setJobs(result.jobs)
    }
  }

  async function createJob(type: string) {
    setLoading(true)

    const response = await fetch("/api/ai/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to create job")
      return
    }

    loadJobs()
  }

  async function runNextJob() {
    setLoading(true)

    const response = await fetch("/api/ai/jobs/run", {
      method: "POST",
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Job failed")
    }

    loadJobs()
  }

  useEffect(() => {
    loadJobs()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>AI Automation Queue</h1>

      <p style={{ maxWidth: 760, color: "var(--muted)", lineHeight: 1.7 }}>
        Queue and run background AI automation jobs. This is the first reliable
        backend layer for scheduled publishing, embeddings, retries and future
        autonomous workflows.
      </p>

      <section style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
        <button
          disabled={loading}
          onClick={() => createJob("publish-scheduled")}
          style={buttonStyle}
        >
          Queue Publish Scheduled
        </button>

        <button
          disabled={loading}
          onClick={() => createJob("embed-published-articles")}
          style={buttonStyle}
        >
          Queue Embed Articles
        </button>

        <button disabled={loading} onClick={runNextJob} style={darkButton}>
          Run Next Job
        </button>
      </section>

      <section style={{ marginTop: 34 }}>
        <h2>Recent Jobs</h2>

        <div style={{ display: "grid", gap: 14 }}>
          {jobs.map((job) => (
            <div key={job.id} style={cardStyle}>
              <div>
                <p style={metaStyle}>{job.status}</p>
                <h3 style={{ margin: "4px 0" }}>{job.type}</h3>
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  Attempts: {job.attempts} · Scheduled:{" "}
                  {new Date(job.scheduledAt).toLocaleString("en-AU")}
                </p>

                {job.error ? (
                  <p style={{ color: "#cc0000" }}>{job.error}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "var(--card-background)",
  color: "var(--foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const darkButton: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 10,
  border: "none",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 22,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--muted)",
  fontSize: 13,
  margin: 0,
}