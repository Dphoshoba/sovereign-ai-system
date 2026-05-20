"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useState } from "react"

export default function AskPage() {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)

  async function askQuestion(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setAnswer("")

    const response = await fetch("/api/ai/knowledge-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      setAnswer(result.error || "Something went wrong.")
      return
    }

    setAnswer(result.answer)
  }

  return (
    <main style={{ fontFamily: "Arial, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <section style={{ background: "#111", color: "#fff", padding: "72px 40px" }}>
        <p style={{ textTransform: "uppercase", letterSpacing: 2, color: "#bbb" }}>
          Echoes & Visions
        </p>

        <h1 style={{ maxWidth: 900, fontSize: 52, lineHeight: 1.05 }}>
          Ask the Knowledge Base
        </h1>

        <p style={{ maxWidth: 760, fontSize: 20, lineHeight: 1.6, color: "#ddd" }}>
          Ask questions based on published Echoes & Visions articles.
        </p>
      </section>

      <section style={{ maxWidth: 900, margin: "0 auto", padding: "42px 24px" }}>
        <form onSubmit={askQuestion} style={formStyle}>
          <label>
            Your question
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={5}
              required
              placeholder="Example: How can AI agents help small businesses save time?"
              style={inputStyle}
            />
          </label>

          <button disabled={loading} style={buttonStyle}>
            {loading ? "Thinking..." : "Ask"}
          </button>
        </form>

        {answer ? (
          <section style={answerBox}>
            <h2>Answer</h2>
            <div className="markdown-body" style={{ lineHeight: 1.8 }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
               {answer}
            </ReactMarkdown>
          </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 8,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ccc",
  fontSize: 16,
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}

const answerBox: React.CSSProperties = {
  marginTop: 28,
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 28,
}