"use client"

import { useEffect, useState } from "react"

type AiDepartment = {
  id: string
  name: string
  description: string | null
  status: string
}

type AiAgent = {
  id: string
  name: string
  role: string
  instructions: string
  tools: string | null
  tags: string | null
  status: string
  department: AiDepartment | null
}

export default function AiAgentsPage() {
  const [agents, setAgents] = useState<AiAgent[]>([])
  const [departments, setDepartments] = useState<AiDepartment[]>([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: "",
    departmentName: "Publishing Department",
    role: "",
    instructions: "",
    tools: "",
    tags: "",
    status: "active",
  })

  async function loadAgents() {
    const response = await fetch("/api/ai/agents")
    const result = await response.json()

    if (result.ok) {
      setAgents(result.agents)
      setDepartments(result.departments)
    }
  }

  async function saveAgent(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    const response = await fetch("/api/ai/agents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to save agent")
      return
    }

    setForm({
      name: "",
      departmentName: "Publishing Department",
      role: "",
      instructions: "",
      tools: "",
      tags: "",
      status: "active",
    })

    loadAgents()
  }

  useEffect(() => {
    loadAgents()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>AI Organization</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Agent Marketplace + Departments
        </h1>

        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Create specialist AI agents for publishing, SEO, ministry, CRM,
          strategy, growth, YouTube, products and automation.
        </p>
      </section>

      <form onSubmit={saveAgent} style={formStyle}>
        <label>
          Agent Name
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Example: SEO Director"
            style={inputStyle}
          />
        </label>

        <label>
          Department
          <input
            required
            value={form.departmentName}
            onChange={(e) =>
              setForm({ ...form, departmentName: e.target.value })
            }
            placeholder="Example: Growth Department"
            style={inputStyle}
            list="departments"
          />

          <datalist id="departments">
            {departments.map((department) => (
              <option key={department.id} value={department.name} />
            ))}
          </datalist>
        </label>

        <label>
          Role
          <input
            required
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="Example: Improve SEO strategy for every article"
            style={inputStyle}
          />
        </label>

        <label>
          Instructions
          <textarea
            required
            rows={8}
            value={form.instructions}
            onChange={(e) =>
              setForm({ ...form, instructions: e.target.value })
            }
            placeholder="Define what this agent does, its boundaries, standards, and output style."
            style={inputStyle}
          />
        </label>

        <label>
          Tools
          <input
            value={form.tools}
            onChange={(e) => setForm({ ...form, tools: e.target.value })}
            placeholder="articles, memory, crm, jobs, analytics"
            style={inputStyle}
          />
        </label>

        <label>
          Tags
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="seo, publishing, growth"
            style={inputStyle}
          />
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
          {loading ? "Saving..." : "Save Agent"}
        </button>
      </form>

      <section style={{ marginTop: 40 }}>
        <h2>Available Agents</h2>

        <div style={agentGrid}>
          {agents.map((agent) => (
            <article key={agent.id} style={cardStyle}>
              <p style={metaStyle}>
                {agent.department?.name || "No Department"} · {agent.status}
              </p>

              <h3>{agent.name}</h3>

              <p>
                <strong>Role:</strong> {agent.role}
              </p>

              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                {agent.instructions}
              </p>

              {agent.tools ? (
                <p>
                  <strong>Tools:</strong> {agent.tools}
                </p>
              ) : null}

              {agent.tags ? (
                <p>
                  <strong>Tags:</strong> {agent.tags}
                </p>
              ) : null}
            </article>
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
  maxWidth: 840,
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

const agentGrid: React.CSSProperties = {
  display: "grid",
  gap: 18,
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
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