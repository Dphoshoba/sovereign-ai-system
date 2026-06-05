import { prisma } from "@/lib/prisma"

export default async function AdminSubscribersPage() {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  const activeCount = subscribers.filter(
    (subscriber) => subscriber.status === "active"
  ).length

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Subscribers</h1>

      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        <div style={statCardStyle}>
          <strong>Total</strong>
          <span>{subscribers.length}</span>
        </div>

        <div style={statCardStyle}>
          <strong>Active</strong>
          <span>{activeCount}</span>
        </div>
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