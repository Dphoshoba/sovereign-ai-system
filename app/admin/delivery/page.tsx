async function getDeliverySummary() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const response = await fetch(`${baseUrl}/api/delivery/summary`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Failed to load delivery summary")
  }

  return response.json()
}

export default async function DeliveryPage() {
  const data = await getDeliverySummary()
  const summary = data.summary || {
    activeClients: 0,
    activeProjects: 0,
    completedProjects: 0,
    openTasks: 0,
    doneTasks: 0,
    overdueTasks: 0,
    totalProjectValue: 0,
    projects: [],
  }

  function formatAud(value: number) {
    return `AUD ${(value || 0).toLocaleString("en-AU")}`
  }

  function formatDate(value: string | Date | null) {
    if (!value) return "Not set"
    return new Date(value).toLocaleDateString("en-AU")
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Client Delivery OS</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Client Delivery Dashboard
        </h1>
        <p style={{ color: "#ddd", maxWidth: 820, lineHeight: 1.7 }}>
          Overview of project health, task progress, and delivery value across
          all Echoes & Visions clients.
        </p>
      </section>

      <section style={metricsGrid}>
        <div style={metricCard}>
          <p style={metaStyle}>Active Clients</p>
          <h2>{summary.activeClients || 0}</h2>
        </div>

        <div style={metricCard}>
          <p style={metaStyle}>Active Projects</p>
          <h2>{summary.activeProjects || 0}</h2>
        </div>

        <div style={metricCard}>
          <p style={metaStyle}>Completed Projects</p>
          <h2>{summary.completedProjects || 0}</h2>
        </div>

        <div style={metricCard}>
          <p style={metaStyle}>Open Tasks</p>
          <h2>{summary.openTasks || 0}</h2>
        </div>

        <div style={metricCard}>
          <p style={metaStyle}>Done Tasks</p>
          <h2>{summary.doneTasks || 0}</h2>
        </div>

        <div style={metricCard}>
          <p style={metaStyle}>Overdue Tasks</p>
          <h2>{summary.overdueTasks || 0}</h2>
        </div>

        <div style={metricCard}>
          <p style={metaStyle}>Total Project Value</p>
          <h2>{formatAud(summary.totalProjectValue || 0)}</h2>
        </div>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Project Health</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {(summary.projects || []).length === 0 && (
            <p>No projects yet.</p>
          )}

          {(summary.projects || []).map((project: any) => (
            <article key={project.id} style={cardStyle}>
              <p style={metaStyle}>{project.status}</p>
              <h3 style={{ marginTop: 0 }}>{project.title}</h3>

              <p>
                <strong>Client:</strong> {project.clientName}
              </p>

              <p>
                <strong>Due Date:</strong> {formatDate(project.dueDate)}
              </p>

              <p>
                <strong>Value:</strong> {formatAud(project.valueAud || 0)}
              </p>

              <p>
                <strong>Progress:</strong> {project.progressPercent || 0}%
              </p>

              <p>
                <strong>Tasks:</strong> {project.taskCount || 0} total ·{" "}
                {project.doneTaskCount || 0} done ·{" "}
                {project.overdueTaskCount || 0} overdue
              </p>

              <div style={progressTrackStyle}>
                <div
                  style={{
                    ...progressFillStyle,
                    width: `${project.progressPercent || 0}%`,
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

const heroStyle: React.CSSProperties = {
  background: "#111",
  color: "#fff",
  borderRadius: 24,
  padding: 34,
}

const eyebrowStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "#aaa",
  margin: 0,
}

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const metricCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const cardStyle: React.CSSProperties = {
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

const progressTrackStyle: React.CSSProperties = {
  marginTop: 12,
  height: 10,
  background: "#eee",
  borderRadius: 999,
  overflow: "hidden",
}

const progressFillStyle: React.CSSProperties = {
  height: "100%",
  background: "#111",
  borderRadius: 999,
}
