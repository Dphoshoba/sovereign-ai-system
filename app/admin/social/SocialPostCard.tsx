"use client"

import { useState } from "react"

type Props = {
  post: {
    id: string
    platform: string
    content: string
    status: string
    articleId: string | null
    createdAt: string
  }
}

export default function SocialPostCard({ post }: Props) {
  const [copied, setCopied] = useState(false)

  async function copyPost() {
    await navigator.clipboard.writeText(post.content)

    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-300">
          {post.platform}
        </span>

        <span className="text-sm text-zinc-500">
          {new Intl.DateTimeFormat("en-AU", {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: "Australia/Adelaide",
          }).format(new Date(post.createdAt))}
        </span>
      </div>

      <p className="whitespace-pre-wrap text-zinc-200">
        {post.content}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={copyPost}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          {copied ? "Copied!" : "Copy Post"}
        </button>

        <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
          Status: {post.status}
        </span>

        <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
          Article ID: {post.articleId || "None"}
        </span>
      </div>
    </article>
  )
}