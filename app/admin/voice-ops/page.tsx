"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

declare global {
  interface Window {
    webkitSpeechRecognition?: any
    SpeechRecognition?: any
  }
}

export default function VoiceOpsPage() {
  const [command, setCommand] = useState("")
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)

  async function sendCommand(event?: React.FormEvent) {
    event?.preventDefault()

    if (!command.trim()) return

    setLoading(true)
    setAnswer("")

    const response = await fetch("/api/ai/conversation-ops", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ command }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Command failed")
      return
    }

    setAnswer(result.answer)
  }

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Use Chrome.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-AU"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setListening(true)

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript
      setCommand(text)
      setListening(false)
    }

    recognition.onerror = () => {
      setListening(false)
      alert("Voice recognition failed. Try again.")
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognition.start()
  }

  function cleanSpeechText(text: string) {
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/`/g, "")
    .replace(/>\s/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[-•]\s/g, "")
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim()
}

function speakAnswer() {
  if (!answer) return

  const cleaned = cleanSpeechText(answer)

  const utterance = new SpeechSynthesisUtterance(cleaned)

  utterance.lang = "en-AU"
  utterance.rate = 1
  utterance.pitch = 1

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Conversational Command Center</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          AI Voice + Operations Layer
        </h1>

        <p style={{ color: "#ddd", maxWidth: 850, lineHeight: 1.7 }}>
          Speak or type commands to your Echoes & Visions AI organization.
          Ask for strategy, simulations, CRM insight, publishing direction,
          revenue thinking and operational recommendations.
        </p>
      </section>

      <form onSubmit={sendCommand} style={formStyle}>
        <label>
          Command
          <textarea
            rows={6}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            required
            placeholder="Example: Executive Brain, what is the strongest growth move for Echoes & Visions this week?"
            style={inputStyle}
          />
        </label>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Thinking..." : "Send Command"}
          </button>

          <button
            type="button"
            onClick={startListening}
            disabled={listening}
            style={secondaryButton}
          >
            {listening ? "Listening..." : "Start Voice"}
          </button>

          <button
            type="button"
            onClick={speakAnswer}
            disabled={!answer}
            style={secondaryButton}
          >
            Speak Answer
          </button>
        </div>
      </form>

      {answer ? (
        <section style={answerStyle}>
          <h2>Operations Response</h2>

          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {answer}
            </ReactMarkdown>
          </div>
        </section>
      ) : null}
    </main>
  )
}

const heroStyle: React.CSSProperties = {
  background: "#111",
  color: "#fff",
  borderRadius: 24,
  padding: 34,
}

const eyebrowStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "#aaa",
  margin: 0,
}

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  maxWidth: 900,
  marginTop: 24,
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
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

const secondaryButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#fff",
  color: "#111",
  cursor: "pointer",
  fontWeight: "bold",
}

const answerStyle: React.CSSProperties = {
  marginTop: 28,
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 28,
}