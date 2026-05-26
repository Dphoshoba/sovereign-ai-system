"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

type Props = {
  queueId: string
}

export default function ScheduleButton({ queueId }: Props) {
  const [scheduledAt, setScheduledAt] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function scheduleItem() {
    if (!scheduledAt) {
      alert("Please choose a schedule date and time.")
      return
    }

    await fetch("/api/publishing/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queueId,
        status: "scheduled",
        scheduledAt,
      }),
    })

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="datetime-local"
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
        className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
      />

      <button
        onClick={scheduleItem}
        disabled={isPending}
        className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
      >
        {isPending ? "Scheduling..." : "Schedule"}
      </button>
    </div>
  )
}