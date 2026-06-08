"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type ChartItem = {
  label: string
  value: number
}

export function DashboardCharts({ data }: { data: ChartItem[] }) {
  return (
    <section style={boxStyle}>
      <h2>Platform Overview</h2>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

const boxStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "14px",
  padding: "20px",
  marginTop: "28px",
}
