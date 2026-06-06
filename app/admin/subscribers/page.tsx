import { prisma } from "@/lib/prisma"
import { SubscriberActions } from "@/components/subscribers/SubscriberActions"

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = copy.getDate() - day
  copy.setDate(diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export default async function AdminSubscribersPage() {
  const now = new Date()
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)

  const subscribers = await prisma.subscriber.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  const totalCount = subscribers.length

  const activeCount = subscribers.filter(
    (subscriber) => subscriber.status === "active"
  ).length

  const newThisWeek = subscribers.filter(
    (subscriber) => new Date(subscriber.createdAt) >= weekStart
  ).length

  const newThisMonth = subscribers.filter(
    (subscriber) => new Date(subscriber.createdAt) >= monthStart
  ).length

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Subscribers</h1>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "20px" }}>
        <div style={statCardStyle}>
          <strong>Total</strong>
          <span>{totalCount}</span>
        </div>

        <div style={statCardStyle}>
          <strong>Active</strong>
          <span>{activeCount}</span>
        </div>

        <div style={statCardStyle}>
          <strong>New This Week</strong>
          <span>{newThisWeek}</span>
        </div>

        <div style={statCardStyle}>
          <strong>New This Month</strong>
          <span>{newThisMonth}</span>
        </div>
      </div>

      <div style={{ marginTop: "24px" }}>
        <a href="/api/subscribers/export" style={buttonStyle}>
          Export CSV
        </a>
      </div>

      <div style={{ display: "grid", gap: "12px", marginTop: "24px" }}>
        {subscribers.map((subscriber) => (
          <div key={subscriber.id} style={cardStyle}>
            <p>
              <strong>Email:</strong> {subscriber.email}
            </p>

            <p>
              <strong>Status:</strong> {subscriber.status}
            </p>

            <SubscriberActions
              subscriberId={subscriber.id}
              status={subscriber.status}
            />

            <p>
              <strong>Joined:</strong>{" "}
              {new Date(subscriber.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}

const statCardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "16px",
  minWidth: "160px",
  display: "grid",
  gap: "8px",
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "16px",
}

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "8px",
  background: "#111",
  color: "#fff",
  textDecoration: "none",
  fontWeight: "bold",
}