"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

type Props = {
  queueId: string
}

export default function RetryButton({
  queueId,
}: Props) {
  const [isPending, startTransition] =
    useTransition()

  const router = useRouter()

  async function retry() {
    await fetch(
      "/api/publishing/update-status",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          queueId,
          status: "pending",
        }),
      }
    )

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <button
      onClick={retry}
      disabled={isPending}
      className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400 disabled:opacity-50"
    >
      {isPending
        ? "Retrying..."
        : "Retry"}
    </button>
  )
}