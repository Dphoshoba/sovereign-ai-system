"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

type Props = {
  youtubePostId: string
  endpoint: string
  label: string
  loadingLabel: string
  className?: string
}

export default function ActionButton({
  youtubePostId,
  endpoint,
  label,
  loadingLabel,
  className = "",
}: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function runAction() {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ youtubePostId }),
    })

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <button
      onClick={runAction}
      disabled={isPending}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${className}`}
    >
      {isPending ? loadingLabel : label}
    </button>
  )
}