"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

type Props = {
  youtubePostId: string
}

export default function UploadButton({
  youtubePostId,
}: Props) {
  const [isPending, startTransition] =
    useTransition()

  const router = useRouter()

  async function uploadVideo() {
    await fetch("/api/youtube/upload", {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        youtubePostId,
      }),
    })

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <button
      onClick={uploadVideo}
      disabled={isPending}
      className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
    >
      {isPending
        ? "Uploading..."
        : "Upload to YouTube"}
    </button>
  )
}