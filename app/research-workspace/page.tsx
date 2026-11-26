import Link from "next/link"
import { getResearchMissions } from "../../lib/gamma/research-registry"

export const dynamic = "force-dynamic"

export default async function ResearchWorkspacesPage() {
  const missions = await getResearchMissions()

  return (
    <main style={pageStyle}>
      {/* Header */}
      <section style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>EV-KOS</p>
          <h1 style={titleStyle}>Research Workspaces</h1>
          <p style={subtitleStyle}>
            Explore research workspaces with mission cards, confidence levels, discovery counts,
            questions, scripture references, timelines, knowledge domains, progress tracking,
            related workspaces, and status indicators. All in read-only preview mode.
          </p>
        </div>
      </section>

      {/* System Status */}
      <section style={statusGridStyle}>
        <StatusCard label="Mode" value="Read-Only" detail="Preview only" />
        <StatusCard label="Database" value="Disabled" detail="No writes" />
        <StatusCard label="Execution" value="Preview" detail="No execution" />
        <StatusCard label="Auth" value="None" detail="Public access" />
      </section>

      {/* Workspaces Grid */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Available Workspaces</h2>
        <div style={gridStyle}>
          {missions.map((mission) => (
            <Link
              href={`/research-workspace/${mission.slug}`}
              key={mission.slug}
              style={{ textDecoration: "none" }}
            >
              <article style={workspaceCardStyle}>
                <div style={cardHeaderStyle}>
                  <h3 style={cardTitleStyle}>{mission.title}</h3>
                  <StatusIndicator status={mission.status} />
                </div>
                <p style={descriptionStyle}>{mission.domain}</p>

                <div style={metricsGridStyle}>
                  <div style={metricBoxStyle}>
                    <p style={metricValueStyle}>{mission.progress}%</p>
                    <p style={metricLabelStyle}>Progress</p>
                  </div>
                  <div style={metricBoxStyle}>
                    <p style={metricValueStyle}>{mission.discoveries}</p>
                    <p style={metricLabelStyle}>Discoveries</p>
                  </div>
                  <div style={metricBoxStyle}>
                    <p style={metricValueStyle}>{mission.questions}</p>
                    <p style={metricLabelStyle}>Questions</p>
                  </div>
                  <div style={metricBoxStyle}>
                    <p style={metricValueStyle}>{mission.scriptures}</p>
                    <p style={metricLabelStyle}>Scriptures</p>
                  </div>
                </div>

                <div style={footerStyle}>
                  <span style={confidenceBadgeStyle(mission.confidence)}>
                    {mission.confidence}
                  </span>
                  <span style={createdDateStyle}>
                    Created {mission.created.toLocaleDateString()}
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Dashboard Features</h2>
        <div style={featureGridStyle}>
          <FeatureCard
            title="Mission Cards"
            description="View research missions with progress, domains, confidence levels, and completion estimates"
          />
          <FeatureCard
            title="Confidence Levels"
            description="Track research confidence from low to very-high across all discoveries and questions"
          />
          <FeatureCard
            title="Discovery Counts"
            description="Monitor documented findings with source tracking and domain categorization"
          />
          <FeatureCard
            title="Question Tracking"
            description="Track research questions with status, related discoveries, and confidence levels"
          />
          <FeatureCard
            title="Scripture References"
            description="Cross-reference biblical passages with confidence levels and domain tags"
          />
          <FeatureCard
            title="Timeline View"
            description="See research activity history with timestamps and status indicators"
          />
          <FeatureCard
            title="Knowledge Domains"
            description="Organize research by domains like theology, history, archaeology, and more"
          />
          <FeatureCard
            title="Progress Tracking"
            description="Visual progress bars showing overall research completion and mission milestones"
          />
          <FeatureCard
            title="Related Workspaces"
            description="Discover connected research workspaces with shared domains and similarities"
          />
          <FeatureCard
            title="Status Indicators"
            description="Real-time status badges for missions, questions, workspaces, and system health"
          />
        </div>
      </section>

      {/* System Info Footer */}
      <section style={footerSectionStyle}>
        <article style={infoCardStyle}>
          <h2 style={cardTitleStyle}>System Information</h2>
          <dl style={infoListStyle}>
            <div style={infoRowStyle}>
              <dt style={labelStyle}>Mode</dt>
              <dd style={valueStyle}>Read-Only Preview</dd>
            </div>
            <div style={infoRowStyle}>
              <dt style={labelStyle}>Database Writes</dt>
              <dd style={valueStyle}>Disabled</dd>
            </div>
            <div style={infoRowStyle}>
              <dt style={labelStyle}>Execution</dt>
              <dd style={valueStyle}>Preview Only</dd>
            </div>
            <div style={infoRowStyle}>
              <dt style={labelStyle}>Authentication</dt>
              <dd style={valueStyle}>Not Required</dd>
            </div>
            <div style={infoRowStyle}>
              <dt style={labelStyle}>Sessions</dt>
              <dd style={valueStyle}>Stateless</dd>
            </div>
            <div style={infoRowStyle}>
              <dt style={labelStyle}>Persistence</dt>
              <dd style={valueStyle}>Mock Data Only</dd>
            </div>
            <div style={infoRowStyle}>
              <dt style={labelStyle}>Publishing</dt>
              <dd style={valueStyle}>Disabled</dd>
            </div>
          </dl>
        </article>
      </section>
    </main>
  )
}

// Subcomponents

function StatusIndicator({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#16a34a"
      case "reviewing":
        return "#ea580c"
      case "completed":
        return "#0284c7"
      case "paused":
        return "#a16207"
      case "archived":
        return "#64748b"
      default:
        return "#6b7280"
    }
  }

  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: getStatusColor(status),
        }}
      />
      <span style={smallLabelStyle}>{status}</span>
    </span>
  )
}

function FeatureCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <article style={featureCardStyle}>
      <h3 style={featureTitleStyle}>{title}</h3>
      <p style={featureDescriptionStyle}>{description}</p>
    </article>
  )
}

function StatusCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <article style={statusCardStyle}>
      <p style={smallLabelStyle}>{label}</p>
      <p style={statusValueStyle}>{value}</p>
      <p style={statusDetailStyle}>{detail}</p>
    </article>
  )
}

// Styles

const pageStyle: React.CSSProperties = {
  padding: 40,
  fontFamily: "Arial, sans-serif",
  background: "var(--background)",
  color: "var(--foreground)",
  maxWidth: 1400,
  margin: "0 auto",
}

const headerStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  borderRadius: 8,
  padding: 28,
  marginBottom: 24,
}

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: 1,
  fontSize: 12,
}

const titleStyle: React.CSSProperties = {
  margin: "8px 0",
  fontSize: 36,
  letterSpacing: 0,
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--muted)",
  maxWidth: 800,
  lineHeight: 1.6,
}

const statusGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 12,
  marginBottom: 24,
}

const statusCardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  borderRadius: 8,
  padding: 14,
  textAlign: "center",
}

const statusValueStyle: React.CSSProperties = {
  margin: "6px 0",
  fontSize: 20,
  fontWeight: 600,
}

const statusDetailStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "var(--muted)",
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 24,
}

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 14px",
  fontSize: 20,
  letterSpacing: 0,
  fontWeight: 600,
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: 12,
}

const workspaceCardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  borderRadius: 8,
  padding: 16,
  transition: "all 0.2s ease",
  cursor: "pointer",
}

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 8,
}

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  letterSpacing: 0,
  fontWeight: 600,
}

const descriptionStyle: React.CSSProperties = {
  margin: "8px 0",
  color: "var(--muted)",
  lineHeight: 1.5,
  fontSize: 13,
}

const metricsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 8,
  margin: "12px 0",
}

const metricBoxStyle: React.CSSProperties = {
  textAlign: "center",
  padding: 8,
  borderRadius: 6,
  backgroundColor: "var(--background)",
  border: "1px solid var(--border)",
}

const metricValueStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
}

const metricLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  color: "var(--muted)",
}

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 12,
  paddingTop: 12,
  borderTop: "1px solid var(--border)",
}

const confidenceBadgeStyle = (confidence: string): React.CSSProperties => {
  const getColor = (c: string) => {
    switch (c) {
      case "very-high":
        return "#16a34a"
      case "high":
        return "#0284c7"
      case "moderate":
        return "#f59e0b"
      case "low":
        return "#dc2626"
      default:
        return "#6b7280"
    }
  }
  const color = getColor(confidence)
  return {
    display: "inline-block",
    border: `1px solid ${color}`,
    borderRadius: 999,
    padding: "3px 8px",
    fontSize: 11,
    color,
    fontWeight: 600,
  }
}

const createdDateStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--muted)",
}

const featureGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 12,
}

const featureCardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  borderRadius: 8,
  padding: 16,
}

const featureTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
}

const featureDescriptionStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "var(--muted)",
  fontSize: 12,
  lineHeight: 1.5,
}

const footerSectionStyle: React.CSSProperties = {
  marginTop: 32,
}

const infoCardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  borderRadius: 8,
  padding: 20,
}

const infoListStyle: React.CSSProperties = {
  margin: "12px 0 0",
}

const infoRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  borderTop: "1px solid var(--border)",
  paddingTop: 10,
  marginTop: 10,
}

const labelStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--muted)",
  fontSize: 13,
  fontWeight: 500,
}

const valueStyle: React.CSSProperties = {
  margin: 0,
  fontWeight: 600,
  color: "#15803d",
}

const smallLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--muted)",
}

