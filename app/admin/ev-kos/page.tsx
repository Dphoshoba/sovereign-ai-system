import { buildEVKOSOperatorDashboard } from "../../../lib/ev-kos/operator-dashboard"
import { buildOperatorActionDashboard } from "../../../lib/ev-kos/operator-action-preview"

export default function EVKOSOperatorDashboardPage() {
  const dashboard = buildEVKOSOperatorDashboard()
  const actionDashboard = buildOperatorActionDashboard()

  return (
    <main style={pageStyle}>
      <section style={headerStyle}>
        <p style={eyebrowStyle}>EV-KOS Operator</p>
        <h1 style={titleStyle}>Knowledge Operating System Dashboard</h1>
        <p style={subtitleStyle}>
          Read-only operating view for research, content, graph readiness,
          review boundaries, and publishing safety.
        </p>
      </section>

      <section style={summaryGridStyle}>
        <MetricCard
          label="Readiness"
          value={`${dashboard.readinessScore}%`}
          detail={dashboard.readinessStatus}
        />
        <MetricCard
          label="Draft Packets"
          value={dashboard.draftSummary.packetCount}
          detail={dashboard.draftSummary.readinessStatus}
        />
        <MetricCard
          label="Campaign Assets"
          value={dashboard.campaignSummary.totalAssets}
          detail={`${dashboard.campaignSummary.reviewRequiredAssets} need review`}
        />
        <MetricCard
          label="Graph Writes"
          value="Off"
          detail="No write controls"
        />
      </section>

      <section style={sectionGridStyle}>
        {dashboard.sections.map((section) => (
          <article key={section.title} style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h2 style={cardTitleStyle}>{section.title}</h2>
              <StatusBadge status={section.status} />
            </div>
            <p style={scoreStyle}>{section.score}%</p>
            <p style={bodyTextStyle}>{section.summary}</p>
            <dl style={metricListStyle}>
              {section.metrics.map((metric) => (
                <div key={metric.label} style={metricRowStyle}>
                  <dt style={metricLabelStyle}>{metric.label}</dt>
                  <dd style={metricValueStyle}>{metric.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </section>

      <section style={wideSectionStyle}>
        <article style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>Operator Actions</h2>
            <StatusBadge status="PREVIEW ONLY" />
          </div>
          <p style={bodyTextStyle}>
            Governed action previews show what would be checked before any
            future operator execution path. No action can be executed from this
            dashboard.
          </p>

          <section style={summaryGridStyle}>
            <MetricCard
              label="Available"
              value={actionDashboard.summary.total}
              detail="Registered previews"
            />
            <MetricCard
              label="Ready"
              value={actionDashboard.summary.ready}
              detail="Preview-ready"
            />
            <MetricCard
              label="Approval"
              value={actionDashboard.summary.requiringApproval}
              detail="Human approval required"
            />
            <MetricCard
              label="Blocked"
              value={actionDashboard.summary.blocked}
              detail="Validation blocked"
            />
          </section>

          <div style={actionGridStyle}>
            {actionDashboard.availableActions.map((preview) => {
              const action = preview.actionSummary

              if (!action || !preview.validation) return null

              return (
                <article key={action.id} style={actionCardStyle}>
                  <div style={cardHeaderStyle}>
                    <h3 style={actionTitleStyle}>{action.name}</h3>
                    <StatusBadge status={preview.validation.status} />
                  </div>
                  <p style={bodyTextStyle}>{action.description}</p>
                  <dl style={metricListStyle}>
                    <div style={metricRowStyle}>
                      <dt style={metricLabelStyle}>Risk</dt>
                      <dd style={metricValueStyle}>{action.riskLevel}</dd>
                    </div>
                    <div style={metricRowStyle}>
                      <dt style={metricLabelStyle}>Mode</dt>
                      <dd style={metricValueStyle}>{action.executionMode}</dd>
                    </div>
                    <div style={metricRowStyle}>
                      <dt style={metricLabelStyle}>Approvals</dt>
                      <dd style={metricValueStyle}>
                        {action.requiredApprovals.length}
                      </dd>
                    </div>
                  </dl>
                  <p style={bodyTextStyle}>{preview.expectedOutcome}</p>
                </article>
              )
            })}
          </div>
        </article>
      </section>

      <section style={sectionGridStyle}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Safety Flags</h2>
          <dl style={metricListStyle}>
            {Object.entries(dashboard.safetyFlags).map(([key, value]) => (
              <div key={key} style={metricRowStyle}>
                <dt style={metricLabelStyle}>{formatLabel(key)}</dt>
                <dd style={safeValueStyle}>{String(value)}</dd>
              </div>
            ))}
          </dl>
        </article>

        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Recent Blockers</h2>
          <ul style={listStyle}>
            {dashboard.blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </article>

        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Recommended Next Actions</h2>
          <ul style={listStyle}>
            {dashboard.recommendedActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  )
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string | number
  detail: string
}) {
  return (
    <article style={metricCardStyle}>
      <p style={metricLabelStyle}>{label}</p>
      <p style={metricNumberStyle}>{value}</p>
      <p style={bodyTextStyle}>{detail}</p>
    </article>
  )
}

function StatusBadge({ status }: { status: string }) {
  return <span style={badgeStyle}>{status}</span>
}

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())
}

const pageStyle: React.CSSProperties = {
  padding: 40,
  fontFamily: "Arial, sans-serif",
  background: "var(--background)",
  color: "var(--foreground)",
}

const headerStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  borderRadius: 8,
  padding: 28,
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
  fontSize: 34,
  letterSpacing: 0,
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--muted)",
  maxWidth: 760,
  lineHeight: 1.6,
}

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
  marginTop: 18,
}

const sectionGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 14,
  marginTop: 18,
}

const wideSectionStyle: React.CSSProperties = {
  marginTop: 18,
}

const actionGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
  marginTop: 18,
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  borderRadius: 8,
  padding: 20,
}

const metricCardStyle: React.CSSProperties = {
  ...cardStyle,
  minHeight: 132,
}

const actionCardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: 16,
  background: "var(--background)",
}

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
}

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 17,
  letterSpacing: 0,
}

const actionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  letterSpacing: 0,
}

const badgeStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 999,
  padding: "5px 8px",
  fontSize: 11,
  color: "var(--muted)",
  whiteSpace: "nowrap",
}

const scoreStyle: React.CSSProperties = {
  margin: "16px 0 8px",
  fontSize: 28,
  fontWeight: 700,
}

const bodyTextStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "var(--muted)",
  lineHeight: 1.55,
}

const metricListStyle: React.CSSProperties = {
  margin: "16px 0 0",
}

const metricRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  borderTop: "1px solid var(--border)",
  paddingTop: 10,
  marginTop: 10,
}

const metricLabelStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--muted)",
  fontSize: 13,
}

const metricValueStyle: React.CSSProperties = {
  margin: 0,
  fontWeight: 700,
}

const safeValueStyle: React.CSSProperties = {
  ...metricValueStyle,
  color: "#15803d",
}

const metricNumberStyle: React.CSSProperties = {
  margin: "10px 0 0",
  fontSize: 32,
  fontWeight: 700,
}

const listStyle: React.CSSProperties = {
  margin: "14px 0 0",
  paddingLeft: 18,
  color: "var(--muted)",
  lineHeight: 1.7,
}
