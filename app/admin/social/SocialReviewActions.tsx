"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function SocialReviewActions({ postId }: { postId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function approvePost() {
    setLoading(true)

    const response = await fetch("/api/social/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || "Approval failed")
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
  }

  async function rejectPost() {
    setLoading(true)

    const response = await fetch("/api/social/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || "Rejection failed")
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
  }

  async function editPost() {
    const content = prompt("Edit social post content:")

    if (!content) return

    setLoading(true)

    const response = await fetch("/api/social/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content }),
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || "Update failed")
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
  }

  async function regeneratePost() {
    setLoading(true)

    const response = await fetch("/api/social/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || "Regeneration failed")
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
  }

  async function deletePost() {
    const confirmed = confirm("Delete this social post?")

    if (!confirmed) return

    setLoading(true)

    const response = await fetch("/api/social/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || "Delete failed")
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={approvePost} disabled={loading} style={approveStyle}>
        Approve
      </button>

      <button onClick={rejectPost} disabled={loading} style={rejectStyle}>
        Reject
      </button>

      <button onClick={editPost} disabled={loading} style={neutralStyle}>
        Edit
      </button>

      <button onClick={regeneratePost} disabled={loading} style={neutralStyle}>
        Regenerate
      </button>

      <button onClick={deletePost} disabled={loading} style={deleteStyle}>
        Delete
      </button>
    </>
  )
}

const approveStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#15803d",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
}

const rejectStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#b91c1c",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
}

const neutralStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  background: "#f3f4f6",
  color: "#111",
  fontWeight: "bold",
  cursor: "pointer",
}

const deleteStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#444",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
}
