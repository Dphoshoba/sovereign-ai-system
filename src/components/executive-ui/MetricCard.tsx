export default function MetricCard({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div style={metricCard}>
      <p style={metaStyle}>{label}</p>
      <h2 style={{ margin: "6px 0 0" }}>{value}</h2>
    </div>
  )
}

const metricCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#777",
  fontSize: 13,
  margin: 0,
}