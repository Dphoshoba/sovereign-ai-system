"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

type Props = {
  queueId: string
}

export default function PublishButton({ queueId }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function publishNow() {
    await fetch("/api/publishing/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queueId,
        status: "published",
      }),
    })

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <button
      onClick={publishNow}
      disabled={isPending}
      className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-50"
    >
      {isPending ? "Publishing..." : "Publish Now"}
    </button>
  )
}
