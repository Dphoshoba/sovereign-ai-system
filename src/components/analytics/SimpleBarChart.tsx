type ChartItem = {
  label: string
  value: number
}

export function SimpleBarChart({
  title,
  data,
}: {
  title: string
  data: ChartItem[]
}) {
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <section style={chartBoxStyle}>
      <h2>{title}</h2>

      <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
        {data.map((item) => {
          const width = `${(item.value / max) * 100}%`

          return (
            <div key={item.label}>
              <div style={rowTopStyle}>
                <strong>{item.label}</strong>
                <span>{item.value}</span>
              </div>

              <div style={barTrackStyle}>
                <div style={{ ...barFillStyle, width }} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

const chartBoxStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "14px",
  padding: "20px",
  marginTop: "28px",
}

const rowTopStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "6px",
}

const barTrackStyle: React.CSSProperties = {
  height: "12px",
  borderRadius: "999px",
  background: "var(--border)",
  overflow: "hidden",
}

const barFillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "var(--hero-background)",
}