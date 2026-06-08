"use client"

import { useEffect, useState } from "react"

type AiWorkflow = {
  id: string
  name: string
  description: string | null
  trigger: string
  action: string
  status: string
  createdAt: string
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<AiWorkflow[]>([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: "",
    description: "",
    trigger: "article_published",
    action: "queue_social_posts",
    status: "active",
  })

  async function loadWorkflows() {
    const response = await fetch("/api/ai/workflows")
    const result = await response.json()

    if (result.ok) {
      setWorkflows(result.workflows)
    }
  }

  async function saveWorkflow(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    const response = await fetch("/api/ai/workflows", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to save workflow")
      return
    }

    setForm({
      name: "",
      description: "",
      trigger: "article_published",
      action: "queue_social_posts",
      status: "active",
    })

    loadWorkflows()
  }

  useEffect(() => {
    loadWorkflows()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Automation Builder</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Visual AI Workflow Builder
        </h1>

        <p style={{ color: "var(--hero-muted)", maxWidth: 780, lineHeight: 1.7 }}>
          Create automation rules that connect publishing, agents, memory, CRM,
          jobs, activity and growth intelligence.
        </p>
      </section>

      <form onSubmit={saveWorkflow} style={formStyle}>
        <label>
          Workflow Name
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Example: Article Published → Create Social Content"
            style={inputStyle}
          />
        </label>

        <label>
          Description
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            style={inputStyle}
          />
        </label>

        <label>
          Trigger
          <select
            value={form.trigger}
            onChange={(e) => setForm({ ...form, trigger: e.target.value })}
            style={inputStyle}
          >
            <option value="article_published">Article Published</option>
            <option value="lead_created">Lead Created</option>
            <option value="memory_saved">Memory Saved</option>
            <option value="job_completed">Job Completed</option>
            <option value="executive_report_generated">
              Executive Report Generated
            </option>
            <option value="growth_report_generated">
              Growth Report Generated
            </option>
          </select>
        </label>

        <label>
          Action
          <select
            value={form.action}
            onChange={(e) => setForm({ ...form, action: e.target.value })}
            style={inputStyle}
          >
            <option value="queue_social_posts">Queue Social Posts</option>
            <option value="queue_article_embedding">Queue Article Embedding</option>
            <option value="save_memory">Save Memory</option>
            <option value="create_follow_up_strategy">
              Create Follow-Up Strategy
            </option>
            <option value="queue_content_pipeline">Queue Content Pipeline</option>
            <option value="log_activity">Log Activity</option>
          </select>
        </label>

        <label>
          Status
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            style={inputStyle}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </label>

        <button disabled={loading} style={buttonStyle}>
          {loading ? "Saving..." : "Save Workflow"}
        </button>
      </form>

      <section style={{ marginTop: 40 }}>
        <h2>Saved Workflows</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {workflows.map((workflow) => (
            <div key={workflow.id} style={cardStyle}>
              <p style={metaStyle}>{workflow.status}</p>
              <h3>{workflow.name}</h3>

              {workflow.description ? (
                <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                  {workflow.description}
                </p>
              ) : null}

              <div style={workflowLine}>
                <span>{workflow.trigger}</span>
                <strong>→</strong>
                <span>{workflow.action}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

const heroStyle: React.CSSProperties = {
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  borderRadius: 24,
  padding: 34,
}

const eyebrowStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--muted)",
  margin: 0,
}

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  maxWidth: 780,
  marginTop: 24,
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: 12,
  borderRadius: 10,
  border: "1px solid var(--border)",
  fontSize: 16,
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
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
  padding: 24,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--muted)",
  fontSize: 13,
  margin: 0,
}

const workflowLine: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center",
  marginTop: 12,
  padding: 14,
  borderRadius: 12,
  background: "var(--card-background)",
}