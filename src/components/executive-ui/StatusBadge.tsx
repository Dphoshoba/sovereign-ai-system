export default function StatusBadge({ status }: { status: string }) {
  const color =
    status === "critical" || status === "failed"
      ? "#ef4444"
      : status === "warning" || status === "pending"
        ? "#f59e0b"
        : status === "completed" || status === "stable" || status === "active"
          ? "#22c55e"
          : "#6366f1"

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        background: `${color}18`,
        color,
        fontWeight: "bold",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 1,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: color,
        }}
      />
      {status}
    </span>
  )
}