"use client"

import { useEffect, useState } from "react"
import {
  PageShell,
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  StatusBadge,
} from "@/components/executive-ui"

type EmailExecution = {
  id: string
  to: string
  subject: string
  body: string
  status: string
  provider: string
  riskLevel: string
  approved: boolean
  providerId: string | null
  error: string | null
  sentAt: string | null
  createdAt: string
}

export default function EmailExecutionPage() {
  const [emails, setEmails] = useState<EmailExecution[]>([])
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("Following up from Echoes & Visions")
  const [body, setBody] = useState(
    "Hello,\n\nThank you for connecting with Echoes & Visions. I wanted to follow up and see how we can help you build intelligent systems around your creative work.\n\nBlessings,\nEchoes & Visions"
  )
  const [loading, setLoading] = useState(false)

  async function loadEmails() {
    const res = await fetch("/api/email-execution")
    const result = await res.json()

    if (result.ok) {
      setEmails(result.emails)
    }
  }

  async function createEmail() {
    setLoading(true)

    const res = await fetch("/api/email-execution", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject,
        body,
        source: "email-execution-admin",
        riskLevel: "medium",
        approved: false,
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to create email")
      return
    }

    setTo("")
    await loadEmails()
  }

  async function approveEmail(emailId: string) {
    setLoading(true)

    const res = await fetch("/api/email-execution/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emailId }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to approve email")
      return
    }

    await loadEmails()
  }

  async function sendEmail(emailId: string) {
    setLoading(true)

    const res = await fetch("/api/email-execution/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emailId }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to send email")
      return
    }

    await loadEmails()
  }

  useEffect(() => {
    loadEmails()
  }, [])

  const sent = emails.filter((email) => email.status === "sent").length
  const queued = emails.filter((email) => email.status === "queued").length
  const approvalRequired = emails.filter(
    (email) => email.status === "approval-required"
  ).length
  const failed = emails.filter((email) => email.status === "failed").length

  return (
    <PageShell
      eyebrow="Real Email Operations"
      title="Email Execution + Workflow Automation"
      description="Create, approve and send governed operational emails through the external execution layer."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Sent" value={sent} />
        <MetricCard label="Queued" value={queued} />
        <MetricCard label="Approval Required" value={approvalRequired} />
        <MetricCard label="Failed" value={failed} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Create Email" eyebrow="Draft workflow">
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Recipient email"
              style={inputStyle}
            />

            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              style={inputStyle}
            />

            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={inputStyle}
            />

            <button disabled={loading} onClick={createEmail} style={buttonStyle}>
              {loading ? "Creating..." : "Create Email Draft"}
            </button>
          </ExecutiveCard>

          <ExecutiveCard title="Workflow Rules" eyebrow="Governance">
            <ul style={{ lineHeight: 1.9 }}>
              <li>All emails begin as approval-required.</li>
              <li>Approved emails move to queued.</li>
              <li>Only queued approved emails can send.</li>
              <li>Every action creates operational events.</li>
              <li>Every sent email logs external operation output.</li>
            </ul>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Email Queue" eyebrow="Governed sending">
          <div style={{ display: "grid", gap: 14 }}>
            {emails.map((email) => (
              <div key={email.id} style={cardStyle}>
                <StatusBadge status={email.status} />
                <h3>{email.subject}</h3>

                <p>
                  <strong>To:</strong> {email.to}
                </p>

                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                  {email.body}
                </p>

                {email.error ? (
                  <p style={{ color: "#b00020" }}>{email.error}</p>
                ) : null}

                {email.providerId ? (
                  <p style={{ color: "#666" }}>
                    Provider ID: {email.providerId}
                  </p>
                ) : null}

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {!email.approved ? (
                    <button
                      disabled={loading}
                      onClick={() => approveEmail(email.id)}
                      style={secondaryButtonStyle}
                    >
                      Approve
                    </button>
                  ) : null}

                  {email.approved && email.status === "queued" ? (
                    <button
                      disabled={loading}
                      onClick={() => sendEmail(email.id)}
                      style={buttonStyle}
                    >
                      Send Email
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </ExecutiveCard>
      </div>
    </PageShell>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #ddd",
  padding: 12,
  marginBottom: 12,
  fontFamily: "inherit",
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#fff",
  color: "#111",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 16,
  padding: 18,
  background: "#fafafa",
}