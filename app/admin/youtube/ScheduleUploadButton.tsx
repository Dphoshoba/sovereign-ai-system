"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

type Props = {
  youtubePostId: string
}

export default function ScheduleUploadButton({ youtubePostId }: Props) {
  const [scheduledFor, setScheduledFor] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function scheduleUpload() {
    if (!scheduledFor) {
      alert("Please choose a schedule date and time.")
      return
    }

    await fetch("/api/youtube/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        youtubePostId,
        scheduledFor,
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
        value={scheduledFor}
        onChange={(e) => setScheduledFor(e.target.value)}
        className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
      />

      <button
        type="button"
        onClick={scheduleUpload}
        disabled={isPending}
        className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Schedule Upload"}
      </button>
    </div>
  )
}
