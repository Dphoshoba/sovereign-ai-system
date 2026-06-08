async function getClients() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const response = await fetch(`${baseUrl}/api/clients`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Failed to load clients")
  }

  return response.json()
}

export default async function ClientsPage() {
  const data = await getClients()
  const clients = data.clients || []

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Clients</h1>
      <p>Active Echoes & Visions clients converted from won leads.</p>

      <p style={{ marginTop: 16 }}>
        <a href="/admin/client-projects" style={linkStyle}>
          View Projects
        </a>
      </p>

      <section style={{ display: "grid", gap: "16px", marginTop: "24px" }}>
        {clients.length === 0 && <p>No clients yet.</p>}

        {clients.map((client: any) => (
          <article key={client.id} style={cardStyle}>
            <h2>{client.name}</h2>
            <p>{client.email}</p>

            <p>
              <strong>Status:</strong> {client.status}
            </p>

            <p>
              <strong>Source:</strong> {client.source || "N/A"}
            </p>

            <p>
              <strong>Interests:</strong> {client.interests || "N/A"}
            </p>

            <p>
              <strong>Tags:</strong> {client.tags || "N/A"}
            </p>

            <p>
              <strong>Joined:</strong>{" "}
              {new Date(client.createdAt).toLocaleString()}
            </p>
          </article>
        ))}
      </section>
    </main>
  )
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "14px",
  padding: "20px",
}

const linkStyle: React.CSSProperties = {
  color: "#111",
  fontWeight: "bold",
  textDecoration: "none",
  border: "1px solid #111",
  borderRadius: 10,
  padding: "10px 14px",
  display: "inline-block",
}