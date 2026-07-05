import { getMission } from "../../../lib/gamma/research-registry"
import type {
  ResearchWorkspace,
  MissionCard,
  ResearchQuestion,
  DiscoveryItem,
  ScriptureReference,
  TimelineEntry,
  RelatedWorkspace,
  KnowledgeDomain,
  ConfidenceLevel,
} from "../../../lib/research-workspace/types"

export default async function ResearchWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // Use registry's getMission which handles both numeric IDs and slugs
  // Maps: "1" -> "womanhood", "womanhood" -> "womanhood"
  const workspace = await getMission(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <section style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Research Workspace Not Found</h1>
            <p style={subtitleStyle}>The requested research workspace "{id}" does not exist.</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      {/* Header */}
      <section style={headerStyle}>
        <div style={headerContentStyle}>
          <p style={eyebrowStyle}>Research Workspace</p>
          <h1 style={titleStyle}>{workspace.name}</h1>
          <p style={subtitleStyle}>{workspace.description}</p>
        </div>
        <div style={statusContainerStyle}>
          <StatusIndicator status={workspace.status} />
          <span style={previewBadgeStyle}>PREVIEW ONLY</span>
        </div>
      </section>

      {/* Main Metrics */}
      <section style={summaryGridStyle}>
        <MetricCard
          label="Overall Progress"
          value={`${workspace.overallProgress}%`}
          detail="Mission completion rate"
          type="progress"
        />
        <MetricCard
          label="Confidence"
          value={workspace.overallConfidence}
          detail="Research confidence level"
          type="confidence"
        />
        <MetricCard
          label="Discoveries"
          value={workspace.discoveryCount}
          detail={`${workspace.discoveries.length} documented findings`}
          type="metric"
        />
        <MetricCard
          label="Questions"
          value={workspace.questionCount}
          detail={`${workspace.questionsAnswered} answered`}
          type="metric"
        />
        <MetricCard
          label="Scripture References"
          value={workspace.scriptureReferenceCount}
          detail="Cross-referenced passages"
          type="metric"
        />
        <MetricCard
          label="Status"
          value="Read-Only"
          detail="No database writes • No execution"
          type="status"
        />
      </section>

      {/* Progress Bar */}
      <section style={sectionStyle}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Overall Research Progress</h2>
          <div style={progressContainerStyle}>
            <div style={progressBarBackgroundStyle}>
              <div
                style={{
                  ...progressBarFillStyle,
                  width: `${workspace.overallProgress}%`,
                }}
              />
            </div>
            <p style={progressTextStyle}>{workspace.overallProgress}% Complete</p>
          </div>
          <div style={metricRowStyle}>
            <span style={metricLabelStyle}>Last Updated</span>
            <span style={metricValueStyle}>
              {workspace.lastUpdated.toLocaleDateString()}
            </span>
          </div>
        </article>
      </section>

      {/* Mission Cards */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Research Missions ({workspace.missions.length})</h2>
        <div style={gridStyle}>
          {workspace.missions.map((mission: MissionCard) => (
            <MissionCardComponent key={mission.id} mission={mission} />
          ))}
        </div>
      </section>

      {/* Knowledge Domains */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Knowledge Domains</h2>
        <div style={gridStyle}>
          {workspace.domains.map((domain: { domain: KnowledgeDomain; count: number; confidence: ConfidenceLevel }) => (
            <article key={domain.domain} style={cardStyle}>
              <h3 style={cardTitleStyle}>
                {domain.domain.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
              </h3>
              <p style={scoreStyle}>{domain.count}</p>
              <div style={metricListStyle}>
                <div style={metricRowStyle}>
                  <dt style={metricLabelStyle}>Items</dt>
                  <dd style={metricValueStyle}>{domain.count}</dd>
                </div>
                <div style={metricRowStyle}>
                  <dt style={metricLabelStyle}>Confidence</dt>
                  <dd style={metricValueStyle}>
                    <ConfidenceBadge confidence={domain.confidence} />
                  </dd>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Research Questions */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>
          Research Questions ({workspace.questions.length})
        </h2>
        <div style={gridStyle}>
          {workspace.questions.map((question: ResearchQuestion) => (
            <ResearchQuestionCard key={question.id} question={question} />
          ))}
        </div>
      </section>

      {/* Scripture References */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>
          Scripture References ({workspace.scriptureReferenceCount})
        </h2>
        <div style={listContainerStyle}>
          {workspace.scriptureReferences.slice(0, 10).map((ref: ScriptureReference, idx: number) => (
            <div key={idx} style={scriptureItemStyle}>
              <div style={scriptureHeaderStyle}>
                <strong>
                  {ref.book} {ref.chapter}:{ref.verse}
                </strong>
                <ConfidenceBadge confidence={ref.confidence} />
              </div>
              <p style={scriptureTextStyle}>"{ref.text}"</p>
              <div style={domainTagsStyle}>
                {ref.relatedDomains.map((domain) => (
                  <span key={domain} style={tagStyle}>
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Discovery Items */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>
          Key Discoveries ({workspace.discoveryCount})
        </h2>
        <div style={listContainerStyle}>
          {workspace.discoveries.slice(0, 8).map((discovery: DiscoveryItem) => (
            <div key={discovery.id} style={discoveryItemStyle}>
              <div style={discoveryHeaderStyle}>
                <strong>{discovery.title}</strong>
                <div style={badgeGroupStyle}>
                  <span style={domainBadgeStyle}>{discovery.domain}</span>
                  <ConfidenceBadge confidence={discovery.confidence} />
                </div>
              </div>
              <p style={bodyTextStyle}>{discovery.description}</p>
              <div style={metricRowStyle}>
                <span style={metricLabelStyle}>Sources</span>
                <span style={metricValueStyle}>{discovery.sourceCount}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Activity Timeline</h2>
        <div style={timelineContainerStyle}>
          {workspace.timeline.slice(0, 10).map((entry: TimelineEntry, idx: number) => (
            <div key={idx} style={timelineItemStyle}>
              <div style={timelineMarkerStyle} />
              <div style={timelineContentStyle}>
                <div style={timelineHeaderStyle}>
                  <strong>{entry.event}</strong>
                  <span style={timelineStatusBadgeStyle(entry.status)}>
                    {entry.status}
                  </span>
                </div>
                <p style={timelineDateStyle}>
                  {formatTimestamp(entry.timestamp)}
                </p>
                {(entry.discoveryCount || entry.questionsAnswered) && (
                  <p style={bodyTextStyle}>
                    {entry.discoveryCount ? `+${entry.discoveryCount} discoveries` : ""}{" "}
                    {entry.discoveryCount && entry.questionsAnswered ? "• " : ""}
                    {entry.questionsAnswered ? `+${entry.questionsAnswered} answered` : ""}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Related Workspaces */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Related Workspaces</h2>
        <div style={gridStyle}>
          {workspace.relatedWorkspaces.map((related: RelatedWorkspace) => (
            <article key={related.id} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <h3 style={cardTitleStyle}>{related.name}</h3>
                <StatusIndicator status={related.status} size="small" />
              </div>
              <div style={metricListStyle}>
                <div style={metricRowStyle}>
                  <dt style={metricLabelStyle}>Similarity</dt>
                  <dd style={metricValueStyle}>{related.similarity}%</dd>
                </div>
                <div style={metricRowStyle}>
                  <dt style={metricLabelStyle}>Shared Domains</dt>
                  <dd style={metricValueStyle}>{related.sharedDomains.length}</dd>
                </div>
              </div>
              <div style={domainTagsStyle}>
                {related.sharedDomains.map((domain) => (
                  <span key={domain} style={tagStyle}>
                    {domain}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* System Info */}
      <section style={sectionStyle}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>System Status</h2>
          <dl style={metricListStyle}>
            <div style={metricRowStyle}>
              <dt style={metricLabelStyle}>Mode</dt>
              <dd style={safeValueStyle}>Read-Only Preview</dd>
            </div>
            <div style={metricRowStyle}>
              <dt style={metricLabelStyle}>Database Writes</dt>
              <dd style={safeValueStyle}>Disabled</dd>
            </div>
            <div style={metricRowStyle}>
              <dt style={metricLabelStyle}>Execution</dt>
              <dd style={safeValueStyle}>Preview Only</dd>
            </div>
            <div style={metricRowStyle}>
              <dt style={metricLabelStyle}>Authentication</dt>
              <dd style={safeValueStyle}>Not Required</dd>
            </div>
            <div style={metricRowStyle}>
              <dt style={metricLabelStyle}>Session Tracking</dt>
              <dd style={safeValueStyle}>Disabled</dd>
            </div>
            <div style={metricRowStyle}>
              <dt style={metricLabelStyle}>Persistence</dt>
              <dd style={safeValueStyle}>Mock Data Only</dd>
            </div>
          </dl>
        </article>
      </section>
    </main>
  )
}

// Subcomponents

function MissionCardComponent({ mission }: { mission: MissionCard }) {
  return (
    <article style={cardStyle}>
      <div style={cardHeaderStyle}>
        <h3 style={cardTitleStyle}>{mission.title}</h3>
        <StatusBadge status={mission.status} />
      </div>
      <p style={bodyTextStyle}>{mission.objective}</p>

      <div style={progressContainerStyle}>
        <div style={progressBarBackgroundStyle}>
          <div
            style={{
              ...progressBarFillStyle,
              width: `${mission.progress}%`,
            }}
          />
        </div>
        <p style={progressTextStyle}>{mission.progress}%</p>
      </div>

      <dl style={metricListStyle}>
        <div style={metricRowStyle}>
          <dt style={metricLabelStyle}>Domain</dt>
          <dd style={metricValueStyle}>{mission.domain}</dd>
        </div>
        <div style={metricRowStyle}>
          <dt style={metricLabelStyle}>Confidence</dt>
          <dd style={metricValueStyle}>
            <ConfidenceBadge confidence={mission.confidence} />
          </dd>
        </div>
        <div style={metricRowStyle}>
          <dt style={metricLabelStyle}>Questions</dt>
          <dd style={metricValueStyle}>
            {mission.questionsAnswered}/{mission.questionsToAnswer}
          </dd>
        </div>
        <div style={metricRowStyle}>
          <dt style={metricLabelStyle}>Discoveries</dt>
          <dd style={metricValueStyle}>
            {mission.discoveriesMade}/{mission.discoveriesToMake}
          </dd>
        </div>
        <div style={metricRowStyle}>
          <dt style={metricLabelStyle}>Scriptures</dt>
          <dd style={metricValueStyle}>{mission.scriptureReferences.length}</dd>
        </div>
      </dl>
    </article>
  )
}

function ResearchQuestionCard({ question }: { question: ResearchQuestion }) {
  return (
    <article style={cardStyle}>
      <div style={cardHeaderStyle}>
        <h3 style={cardTitleStyle}>{question.question}</h3>
        <QuestionStatusBadge status={question.status} />
      </div>

      <dl style={metricListStyle}>
        <div style={metricRowStyle}>
          <dt style={metricLabelStyle}>Domain</dt>
          <dd style={metricValueStyle}>{question.domain}</dd>
        </div>
        <div style={metricRowStyle}>
          <dt style={metricLabelStyle}>Confidence</dt>
          <dd style={metricValueStyle}>
            <ConfidenceBadge confidence={question.confidence} />
          </dd>
        </div>
        <div style={metricRowStyle}>
          <dt style={metricLabelStyle}>Discoveries</dt>
          <dd style={metricValueStyle}>{question.discoveries.length}</dd>
        </div>
        <div style={metricRowStyle}>
          <dt style={metricLabelStyle}>Status</dt>
          <dd style={metricValueStyle}>{question.status}</dd>
        </div>
      </dl>

      {question.discoveries.length > 0 && (
        <div style={bodyTextStyle}>
          <strong>Related Discoveries:</strong>
          <ul style={smallListStyle}>
            {question.discoveries.slice(0, 3).map((d) => (
              <li key={d.id}>{d.title}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}

function StatusIndicator({
  status,
  size = "medium",
}: {
  status: string
  size?: "small" | "medium"
}) {
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

  const sizeStyle = {
    small: { width: 8, height: 8 },
    medium: { width: 12, height: 12 },
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div
        style={{
          ...sizeStyle[size],
          borderRadius: "50%",
          backgroundColor: getStatusColor(status),
        }}
      />
      <span style={metricLabelStyle}>{status}</span>
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned":
        return "#6366f1"
      case "active":
        return "#16a34a"
      case "blocked":
        return "#dc2626"
      case "completed":
        return "#0284c7"
      default:
        return "#6b7280"
    }
  }

  return (
    <span
      style={{
        ...badgeStyle,
        borderColor: getStatusColor(status),
        color: getStatusColor(status),
      }}
    >
      {status}
    </span>
  )
}

function QuestionStatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "answered":
        return "#16a34a"
      case "partial":
        return "#f59e0b"
      case "unanswered":
        return "#6b7280"
      default:
        return "#6b7280"
    }
  }

  return (
    <span
      style={{
        ...badgeStyle,
        borderColor: getStatusColor(status),
        color: getStatusColor(status),
      }}
    >
      {status}
    </span>
  )
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
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

  return (
    <span
      style={{
        ...badgeStyle,
        borderColor: getConfidenceColor(confidence),
        color: getConfidenceColor(confidence),
      }}
    >
      {confidence}
    </span>
  )
}

// Deterministic timestamp formatting (no locale-dependent formatting)
function formatTimestamp(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${month}/${day}/${year} at ${hours}:${minutes}:${seconds}`
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
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 24,
  marginBottom: 24,
}

const headerContentStyle: React.CSSProperties = {
  flex: 1,
}

const statusContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "flex-end",
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
  maxWidth: 600,
  lineHeight: 1.6,
}

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
  marginBottom: 24,
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 24,
}

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 14px",
  fontSize: 18,
  letterSpacing: 0,
  fontWeight: 600,
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 12,
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  borderRadius: 8,
  padding: 16,
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
  fontSize: 15,
  letterSpacing: 0,
  fontWeight: 600,
}

const scoreStyle: React.CSSProperties = {
  margin: "10px 0 0",
  fontSize: 28,
  fontWeight: 700,
}

const bodyTextStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "var(--muted)",
  lineHeight: 1.55,
  fontSize: 14,
}

const metricListStyle: React.CSSProperties = {
  margin: "12px 0 0",
}

const metricRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  borderTop: "1px solid var(--border)",
  paddingTop: 8,
  marginTop: 8,
  fontSize: 13,
}

const metricLabelStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--muted)",
  fontSize: 12,
}

const metricValueStyle: React.CSSProperties = {
  margin: 0,
  fontWeight: 600,
}

const safeValueStyle: React.CSSProperties = {
  ...metricValueStyle,
  color: "#15803d",
}

const badgeStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 999,
  padding: "4px 8px",
  fontSize: 11,
  color: "var(--muted)",
  whiteSpace: "nowrap",
  display: "inline-block",
}

const previewBadgeStyle: React.CSSProperties = {
  ...badgeStyle,
  backgroundColor: "#fef3c7",
  borderColor: "#f59e0b",
  color: "#92400e",
}

const progressContainerStyle: React.CSSProperties = {
  margin: "12px 0 0",
}

const progressBarBackgroundStyle: React.CSSProperties = {
  width: "100%",
  height: 8,
  backgroundColor: "var(--border)",
  borderRadius: 4,
  overflow: "hidden",
}

const progressBarFillStyle: React.CSSProperties = {
  height: "100%",
  background: "linear-gradient(90deg, #16a34a 0%, #0284c7 100%)",
  transition: "width 0.3s ease",
}

const progressTextStyle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: 12,
  color: "var(--muted)",
}

const listContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
}

const scriptureItemStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: 12,
  background: "var(--card-background)",
}

const scriptureHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 6,
}

const scriptureTextStyle: React.CSSProperties = {
  margin: "6px 0",
  color: "var(--muted)",
  fontStyle: "italic",
  lineHeight: 1.5,
  fontSize: 13,
}

const discoveryItemStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: 12,
  background: "var(--card-background)",
}

const discoveryHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 8,
}

const badgeGroupStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexShrink: 0,
}

const domainBadgeStyle: React.CSSProperties = {
  ...badgeStyle,
  backgroundColor: "var(--border)",
}

const domainTagsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginTop: 8,
}

const tagStyle: React.CSSProperties = {
  ...badgeStyle,
  fontSize: 11,
  padding: "3px 6px",
}

const timelineContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 0,
}

const timelineItemStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  padding: "12px 0",
  borderLeft: "2px solid var(--border)",
  paddingLeft: 12,
  position: "relative",
}

const timelineMarkerStyle: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: "50%",
  backgroundColor: "#0284c7",
  marginTop: 4,
  marginLeft: -20,
  flexShrink: 0,
}

const timelineContentStyle: React.CSSProperties = {
  flex: 1,
}

const timelineHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  marginBottom: 4,
}

const timelineStatusBadgeStyle = (status: string): React.CSSProperties => {
  const getColor = (s: string) => {
    switch (s) {
      case "completed":
        return "#16a34a"
      case "in-progress":
        return "#0284c7"
      case "pending":
        return "#f59e0b"
      default:
        return "#6b7280"
    }
  }
  return {
    ...badgeStyle,
    borderColor: getColor(status),
    color: getColor(status),
  }
}

const timelineDateStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "var(--muted)",
}

const smallListStyle: React.CSSProperties = {
  margin: "6px 0 0",
  paddingLeft: 18,
  fontSize: 12,
}

const metricCardStyle: React.CSSProperties = {
  ...cardStyle,
  minHeight: 100,
}

function MetricCard({
  label,
  value,
  detail,
  type = "metric",
}: {
  label: string
  value: string | number
  detail: string
  type?: "metric" | "progress" | "confidence" | "status"
}) {
  return (
    <article style={metricCardStyle}>
      <p style={metricLabelStyle}>{label}</p>
      <p style={scoreStyle}>{value}</p>
      <p style={bodyTextStyle}>{detail}</p>
    </article>
  )
}
