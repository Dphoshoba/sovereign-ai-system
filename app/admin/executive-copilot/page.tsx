"use client"

import { useEffect, useState } from "react"
import {
  PageShell,
  ExecutiveCard,
  ExecutiveGrid,
  StatusBadge,
} from "@/components/executive-ui"

type CopilotResponse = {
  answer?: string
  executiveSummary?: string
  risks?: string[]
  opportunities?: string[]
  recommendedActions?: {
    label: string
    type: string
    priority: string
    description: string
    payload: any
  }[]
  systemsReferenced?: string[]
}

type Message = {
  id: string
  role: string
  content: string
  metadata: any
  createdAt: string
}

const starterQuestions = [
  "What are the top operational risks right now?",
  "Which creator leads should we prioritize?",
  "What should leadership focus on today?",
  "Where is revenue most likely to stall?",
  "What systems need optimization?",
  "Summarize organizational health.",
]

export default function ExecutiveCopilotPage() {
  const [question, setQuestion] = useState("")
  const [conversationId, setConversationId] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [response, setResponse] = useState<CopilotResponse | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadMessages() {
    const res = await fetch("/api/executive-copilot")
    const result = await res.json()

    if (result.ok) {
      setMessages(result.messages)
    }
  }

  async function askCopilot(customQuestion?: string) {
    const finalQuestion = customQuestion || question

    if (!finalQuestion.trim()) return

    setLoading(true)

    const res = await fetch("/api/executive-copilot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: finalQuestion,
        conversationId: conversationId || undefined,
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Executive Copilot failed")
      return
    }

    setConversationId(result.conversationId)
    setResponse(result.response)
    setQuestion("")
    await loadMessages()
  }

  useEffect(() => {
    loadMessages()
  }, [])

  return (
    <PageShell
      eyebrow="Conversational Enterprise Intelligence"
      title="Executive AI Copilot"
      description="Ask the AI organization strategic questions, inspect operational state and receive executive recommendations across agents, missions, revenue, events, forecasting and optimization."
    >
      <ExecutiveGrid min={360}>
        <ExecutiveCard title="Ask the Organization" eyebrow="Executive command">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask: What needs leadership attention today?"
            rows={7}
            style={inputStyle}
          />

          <button disabled={loading} onClick={() => askCopilot()} style={buttonStyle}>
            {loading ? "Thinking..." : "Ask Executive Copilot"}
          </button>

          <div style={questionGridStyle}>
            {starterQuestions.map((item) => (
              <button
                key={item}
                disabled={loading}
                onClick={() => askCopilot(item)}
                style={suggestionButtonStyle}
              >
                {item}
              </button>
            ))}
          </div>
        </ExecutiveCard>

        <ExecutiveCard title="Latest Executive Response" eyebrow="AI judgment">
          {response ? (
            <div>
              <p style={answerStyle}>{response.answer}</p>

              {response.executiveSummary ? (
                <div style={summaryBox}>
                  <strong>Executive Summary</strong>
                  <p>{response.executiveSummary}</p>
                </div>
              ) : null}

              {response.systemsReferenced?.length ? (
                <div style={tagWrapStyle}>
                  {response.systemsReferenced.map((system) => (
                    <StatusBadge key={system} status={system} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p style={{ color: "var(--muted)" }}>
              Ask a question to generate an executive operating response.
            </p>
          )}
        </ExecutiveCard>
      </ExecutiveGrid>

      {response ? (
        <div style={{ marginTop: 24 }}>
          <ExecutiveGrid min={320}>
            <ExecutiveCard title="Risks" eyebrow="Threat surface">
              <List items={response.risks} empty="No major risks returned." />
            </ExecutiveCard>

            <ExecutiveCard title="Opportunities" eyebrow="Strategic upside">
              <List items={response.opportunities} empty="No opportunities returned." />
            </ExecutiveCard>

            <ExecutiveCard title="Recommended Actions" eyebrow="Execution options">
              {response.recommendedActions?.length ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {response.recommendedActions.map((action, index) => (
                    <div key={index} style={actionCardStyle}>
                      <StatusBadge status={action.priority} />
                      <h3>{action.label}</h3>
                      <p>{action.description}</p>
                      <p style={{ color: "var(--muted)" }}>
                        <strong>Type:</strong> {action.type}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No actions returned.</p>
              )}
            </ExecutiveCard>
          </ExecutiveGrid>
        </div>
      ) : null}

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Recent Copilot Messages" eyebrow="Conversation history">
          <div style={{ display: "grid", gap: 12 }}>
            {messages.slice(0, 12).map((message) => (
              <div key={message.id} style={messageCardStyle}>
                <StatusBadge status={message.role} />
                <p style={{ lineHeight: 1.7 }}>{message.content}</p>
                <p style={{ color: "var(--muted)", fontSize: 12 }}>
                  {new Date(message.createdAt).toLocaleString("en-AU")}
                </p>
              </div>
            ))}
          </div>
        </ExecutiveCard>
      </div>
    </PageShell>
  )
}

function List({ items, empty }: { items?: string[]; empty: string }) {
  if (!items?.length) return <p style={{ color: "var(--muted)" }}>{empty}</p>

  return (
    <ul style={{ lineHeight: 1.9, paddingLeft: 20 }}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid var(--border)",
  padding: 14,
  fontSize: 15,
  fontFamily: "inherit",
  marginBottom: 12,
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const questionGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 16,
}

const suggestionButtonStyle: React.CSSProperties = {
  textAlign: "left",
  padding: 12,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  cursor: "pointer",
}

const answerStyle: React.CSSProperties = {
  fontSize: 18,
  lineHeight: 1.75,
}

const summaryBox: React.CSSProperties = {
  background: "var(--card-background)",
  borderRadius: 14,
  padding: 16,
  marginTop: 14,
}

const tagWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 14,
}

const actionCardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 16,
  background: "var(--card-background)",
}

const messageCardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 14,
  background: "var(--card-background)",
}