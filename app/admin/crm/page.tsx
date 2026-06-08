"use client"

import { useEffect, useState } from "react"

type ClientProfile = {
  id: string
  name: string
  email: string | null
  phone: string | null
  type: string
  status: string
  source: string | null
  interests: string | null
  notes: string | null
  tags: string | null
  createdAt: string
}

export default function CrmPage() {
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    type: "lead",
    status: "new",
    source: "",
    interests: "",
    notes: "",
    tags: "",
  })

  async function loadClients() {
    try {
      const response = await fetch("/api/crm/clients")
      const result = await response.json()

      if (result.ok) {
        setClients(result.clients)
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function saveClient(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/crm/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      const result = await response.json()

      if (!result.ok) {
        alert(result.error || "Failed to save client")
        setLoading(false)
        return
      }

      setForm({
        name: "",
        email: "",
        phone: "",
        type: "lead",
        status: "new",
        source: "",
        interests: "",
        notes: "",
        tags: "",
      })

      await loadClients()
    } catch (error) {
      console.error(error)
      alert("Something went wrong")
    }

    setLoading(false)
  }

  useEffect(() => {
    loadClients()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>AI Client Intelligence</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          CRM + Relationship Memory
        </h1>

        <p style={{ color: "var(--hero-muted)", maxWidth: 780, lineHeight: 1.7 }}>
          Track leads, ministry relationships, creators, founders, businesses
          and audience opportunities across the Echoes & Visions ecosystem.
        </p>
      </section>

      <form onSubmit={saveClient} style={formStyle}>
        <label>
          Name
          <input
            required
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            style={inputStyle}
          />
        </label>

        <label>
          Email
          <input
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            style={inputStyle}
          />
        </label>

        <label>
          Phone
          <input
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
            style={inputStyle}
          />
        </label>

        <label>
          Type
          <select
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value })
            }
            style={inputStyle}
          >
            <option value="lead">Lead</option>
            <option value="client">Client</option>
            <option value="ministry">Ministry</option>
            <option value="partner">Partner</option>
            <option value="subscriber">Subscriber</option>
          </select>
        </label>

        <label>
          Status
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value })
            }
            style={inputStyle}
          >
            <option value="new">New</option>
            <option value="warm">Warm</option>
            <option value="active">Active</option>
            <option value="follow-up">Follow Up</option>
            <option value="closed">Closed</option>
          </select>
        </label>

        <label>
          Source
          <input
            value={form.source}
            onChange={(e) =>
              setForm({ ...form, source: e.target.value })
            }
            placeholder="YouTube, website, church, referral"
            style={inputStyle}
          />
        </label>

        <label>
          Interests
          <textarea
            rows={3}
            value={form.interests}
            onChange={(e) =>
              setForm({ ...form, interests: e.target.value })
            }
            placeholder="AI automation, ministry tools, websites, strategy"
            style={inputStyle}
          />
        </label>

        <label>
          Notes
          <textarea
            rows={5}
            value={form.notes}
            onChange={(e) =>
              setForm({ ...form, notes: e.target.value })
            }
            style={inputStyle}
          />
        </label>

        <label>
          Tags
          <input
            value={form.tags}
            onChange={(e) =>
              setForm({ ...form, tags: e.target.value })
            }
            placeholder="hot-lead, automation, founder"
            style={inputStyle}
          />
        </label>

        <button disabled={loading} style={buttonStyle}>
          {loading ? "Saving..." : "Save Client"}
        </button>
      </form>

      <section style={{ marginTop: 40 }}>
        <h2>Client Profiles</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {clients.map((client) => (
            <div key={client.id} style={cardStyle}>
              <p style={metaStyle}>
                {client.type} · {client.status}
              </p>

              <h3>{client.name}</h3>

              <p>
                {client.email || "No email"}
                {client.phone ? ` · ${client.phone}` : ""}
              </p>

              {client.source ? (
                <p>
                  <strong>Source:</strong> {client.source}
                </p>
              ) : null}

              {client.interests ? (
                <p>
                  <strong>Interests:</strong> {client.interests}
                </p>
              ) : null}

              {client.notes ? (
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                  {client.notes}
                </p>
              ) : null}

              {client.tags ? (
                <p>
                  <strong>Tags:</strong> {client.tags}
                </p>
              ) : null}
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