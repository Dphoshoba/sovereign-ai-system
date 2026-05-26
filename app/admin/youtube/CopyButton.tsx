"use client"

import { useState } from "react"

type CopyButtonProps = {
  value: string
  label?: string
}

export default function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 1800)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200"
    >
      {copied ? "Copied!" : label}
    </button>
  )
}