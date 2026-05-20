import type { ReactNode } from "react"

export default function ExecutiveGrid({
  children,
  min = 260,
}: {
  children: ReactNode
  min?: number
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`,
        gap: 18,
      }}
    >
      {children}
    </div>
  )
}