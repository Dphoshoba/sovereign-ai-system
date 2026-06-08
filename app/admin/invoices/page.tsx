"use client"

import { useEffect, useMemo, useState } from "react"

type Client = {
  id: string
  name: string
}

type ClientProject = {
  id: string
  clientId: string
  title: string
}

type ClientInvoice = {
  id: string
  clientId: string
  projectId: string | null
  invoiceNumber: string
  amountAud: number
  status: string
  dueDate: string | null
  paidDate: string | null
  notes: string | null
  createdAt: string
  client: Client | null
  project: ClientProject | null
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<ClientInvoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<ClientProject[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [form, setForm] = useState({
    clientId: "",
    projectId: "",
    invoiceNumber: "",
    amountAud: "",
    dueDate: "",
  })

  async function loadInvoices() {
    const response = await fetch("/api/client-invoices", {
      cache: "no-store",
    })
    const result = await response.json()

    if (result.ok) {
      setInvoices(result.invoices)
    }
  }

  async function loadClients() {
    const response = await fetch("/api/clients", {
      cache: "no-store",
    })
    const result = await response.json()

    if (result.ok) {
      setClients(result.clients)
      if (!form.clientId && result.clients.length > 0) {
        setForm((current) => ({
          ...current,
          clientId: result.clients[0].id,
        }))
      }
    }
  }

  async function loadProjects() {
    const response = await fetch("/api/client-projects", {
      cache: "no-store",
    })
    const result = await response.json()

    if (result.ok) {
      setProjects(result.projects)
    }
  }

  async function createInvoice(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    const response = await fetch("/api/client-invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId: form.clientId,
        projectId: form.projectId || null,
        invoiceNumber: form.invoiceNumber,
        amountAud: form.amountAud,
        dueDate: form.dueDate || null,
      }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to create invoice")
      return
    }

    setForm({
      clientId: form.clientId,
      projectId: "",
      invoiceNumber: "",
      amountAud: "",
      dueDate: "",
    })

    await loadInvoices()
  }

  async function updateInvoiceStatus(invoiceId: string, status: string) {
    setActionLoading(true)

    const response = await fetch("/api/client-invoices", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: invoiceId, status }),
    })

    const result = await response.json()
    setActionLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to update invoice")
      return
    }

    await loadInvoices()
  }

  async function downloadInvoicePdf(invoice: ClientInvoice) {
    setActionLoading(true)

    try {
      const response = await fetch("/api/client-invoices/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoiceId: invoice.id }),
      })

      if (!response.ok) {
        const result = await response.json()
        alert(result.error || "Failed to download PDF")
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `invoice-${invoice.invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
    loadClients()
    loadProjects()
  }, [])

  const clientProjects = useMemo(
    () => projects.filter((project) => project.clientId === form.clientId),
    [projects, form.clientId]
  )

  const totalInvoiced = invoices
    .filter((invoice) => invoice.status !== "draft")
    .reduce((sum, invoice) => sum + invoice.amountAud, 0)

  const totalPaid = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amountAud, 0)

  const outstanding = invoices
    .filter((invoice) => ["sent", "overdue"].includes(invoice.status))
    .reduce((sum, invoice) => sum + invoice.amountAud, 0)

  const overdue = invoices
    .filter((invoice) => invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.amountAud, 0)

  function formatAud(value: number) {
    return `AUD ${value.toLocaleString("en-AU")}`
  }

  function formatDate(value: string | null) {
    if (!value) return "Not set"
    return new Date(value).toLocaleDateString("en-AU")
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Client Delivery OS</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Client Invoices</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Track invoicing and payment status for Echoes & Visions client
          projects.
        </p>
      </section>

      <section style={metricsGrid}>
        <div style={metricCard}>
          <p style={metaStyle}>Total Invoiced</p>
          <h2>{formatAud(totalInvoiced)}</h2>
        </div>

        <div style={metricCard}>
          <p style={metaStyle}>Total Paid</p>
          <h2>{formatAud(totalPaid)}</h2>
        </div>

        <div style={metricCard}>
          <p style={metaStyle}>Outstanding</p>
          <h2>{formatAud(outstanding)}</h2>
        </div>

        <div style={metricCard}>
          <p style={metaStyle}>Overdue</p>
          <h2>{formatAud(overdue)}</h2>
        </div>
      </section>

      <form onSubmit={createInvoice} style={formStyle}>
        <h2 style={{ marginTop: 0 }}>Create Invoice</h2>

        <label>
          Client
          <select
            value={form.clientId}
            onChange={(e) =>
              setForm({ ...form, clientId: e.target.value, projectId: "" })
            }
            style={inputStyle}
          >
            {clients.length === 0 && <option value="">No clients</option>}
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Project
          <select
            value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            style={inputStyle}
          >
            <option value="">No project</option>
            {clientProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          Invoice Number
          <input
            value={form.invoiceNumber}
            onChange={(e) =>
              setForm({ ...form, invoiceNumber: e.target.value })
            }
            style={inputStyle}
          />
        </label>

        <label>
          Amount (AUD)
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amountAud}
            onChange={(e) => setForm({ ...form, amountAud: e.target.value })}
            style={inputStyle}
          />
        </label>

        <label>
          Due Date
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            style={inputStyle}
          />
        </label>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Creating..." : "Create Invoice"}
        </button>
      </form>

      <section style={{ marginTop: 40 }}>
        <h2>Invoice List</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {invoices.length === 0 && <p>No invoices yet.</p>}

          {invoices.map((invoice) => (
            <article key={invoice.id} style={cardStyle}>
              <p style={metaStyle}>{invoice.status}</p>
              <h3 style={{ marginTop: 0 }}>{invoice.invoiceNumber}</h3>

              <p>
                <strong>Client:</strong>{" "}
                {invoice.client?.name || "Unknown client"}
              </p>

              <p>
                <strong>Project:</strong>{" "}
                {invoice.project?.title || "No project"}
              </p>

              <p>
                <strong>Amount:</strong> {formatAud(invoice.amountAud)}
              </p>

              <p>
                <strong>Due Date:</strong> {formatDate(invoice.dueDate)}
              </p>

              <p>
                <strong>Paid Date:</strong> {formatDate(invoice.paidDate)}
              </p>

              {invoice.notes ? <p>{invoice.notes}</p> : null}

              <div style={actionButtonsStyle}>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => downloadInvoicePdf(invoice)}
                  style={secondaryButtonStyle}
                >
                  Download PDF
                </button>

                {invoice.status !== "sent" && invoice.status !== "paid" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => updateInvoiceStatus(invoice.id, "sent")}
                    style={secondaryButtonStyle}
                  >
                    Mark Sent
                  </button>
                )}

                {invoice.status !== "paid" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => updateInvoiceStatus(invoice.id, "paid")}
                    style={secondaryButtonStyle}
                  >
                    Mark Paid
                  </button>
                )}

                {invoice.status !== "overdue" && invoice.status !== "paid" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => updateInvoiceStatus(invoice.id, "overdue")}
                    style={secondaryButtonStyle}
                  >
                    Mark Overdue
                  </button>
                )}
              </div>
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

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const metricCard: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  maxWidth: 840,
  marginTop: 28,
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

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  color: "var(--foreground)",
  cursor: "pointer",
  fontWeight: 600,
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
  fontSize: 12,
  color: "var(--muted)",
  margin: "0 0 8px",
}

const actionButtonsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 12,
}
