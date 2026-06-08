import Link from "next/link"
import {
  PageShell,
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  StatusBadge,
} from "@/components/executive-ui"

const systems = [
  { name: "Event Bus", href: "/admin/operational-events", status: "active" },
  { name: "Tool Gateway", href: "/admin/tool-gateway", status: "stable" },
  { name: "Optimization", href: "/admin/optimization-engine", status: "active" },
  { name: "Predictive Intelligence", href: "/admin/predictive-intelligence", status: "active" },
  { name: "Mission Cycles", href: "/admin/autonomous-missions", status: "pending" },
  { name: "Executive Agents", href: "/admin/executive-agents", status: "active" },
  { name: "Agent Boardroom", href: "/admin/agent-collaboration", status: "stable" },
  { name: "Creator Center", href: "/admin/creator-command-center", status: "active" },
]

const layers = [
  {
    title: "Observe",
    body: "Event Bus, CRM, revenue signals and operational alerts.",
  },
  {
    title: "Think",
    body: "Executive Brain, forecasts, simulations and strategic reasoning.",
  },
  {
    title: "Coordinate",
    body: "Agents, delegation, boardroom collaboration and missions.",
  },
  {
    title: "Execute",
    body: "Tool Gateway, governed actions, invoices, CRM updates and workflows.",
  },
  {
    title: "Improve",
    body: "Optimization engine, learning memory and self-healing loops.",
  },
]

export default function CommandCenterV2Page() {
  return (
    <PageShell
      eyebrow="Unified Executive Command Center V2 · Legacy"
      title="Echoes & Visions AI Operating Console"
      description="One strategic cockpit for monitoring intelligence, agents, events, revenue, missions, optimization, forecasting and execution."
    >
      <div
        style={{
          marginBottom: 24,
          padding: 16,
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--card-background)",
        }}
      >
        <strong>Legacy console.</strong> Prefer{" "}
        <Link href="/admin/command-center" style={{ fontWeight: "bold" }}>
          V1 Command Center
        </Link>{" "}
        and{" "}
        <Link href="/admin/runtime" style={{ fontWeight: "bold" }}>
          V1 Runtime
        </Link>{" "}
        for the current executive stack.
      </div>

      <ExecutiveGrid min={220}>
        <MetricCard label="Organization Health" value="87%" />
        <MetricCard label="AI Systems Online" value="12" />
        <MetricCard label="Active Signals" value="Live" />
        <MetricCard label="Execution Mode" value="Governed" />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="System Pulse" eyebrow="Live systems">
            <ExecutiveGrid min={210}>
              {systems.map((system) => (
                <Link
                  key={system.href}
                  href={system.href}
                  style={systemCardStyle}
                >
                  <StatusBadge status={system.status} />
                  <h3 style={{ marginBottom: 8 }}>{system.name}</h3>
                  <span style={openStyle}>Open →</span>
                </Link>
              ))}
            </ExecutiveGrid>
          </ExecutiveCard>

          <ExecutiveCard title="Executive AI Dock" eyebrow="Command assistant">
            <div style={aiBoxStyle}>
              <StatusBadge status="active" />
              <h3>Ask the organization what needs attention.</h3>
              <p style={mutedTextStyle}>
                Next, this dock connects to Executive Brain, Event Bus,
                Optimization Engine and Forecasting Layer.
              </p>
            </div>

            <div style={actionGridStyle}>
              <Link href="/admin/operational-events" style={actionButtonStyle}>
                Review Alerts
              </Link>
              <Link href="/admin/optimization-engine" style={actionButtonStyle}>
                Run Optimization
              </Link>
              <Link href="/admin/predictive-intelligence" style={actionButtonStyle}>
                Forecast Strategy
              </Link>
              <Link href="/admin/autonomous-missions" style={actionButtonStyle}>
                Start Mission Cycle
              </Link>
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Strategic Layers" eyebrow="Operating model">
            <div style={{ display: "grid", gap: 12 }}>
              {layers.map((layer) => (
                <div key={layer.title} style={layerStyle}>
                  <h3 style={{ marginTop: 0 }}>{layer.title}</h3>
                  <p style={mutedTextStyle}>{layer.body}</p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Immediate Executive Priorities" eyebrow="Next moves">
            <ol style={priorityListStyle}>
              <li>Connect live metrics from all subsystems.</li>
              <li>Add global AI status bar across admin pages.</li>
              <li>Integrate event stream preview into this cockpit.</li>
              <li>Add Executive Brain command input.</li>
              <li>Group navigation into strategic departments.</li>
            </ol>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>
    </PageShell>
  )
}

const systemCardStyle: React.CSSProperties = {
  display: "block",
  textDecoration: "none",
  color: "var(--foreground)",
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  borderRadius: 18,
  padding: 18,
}

const openStyle: React.CSSProperties = {
  color: "#4f46e5",
  fontWeight: "bold",
}

const aiBoxStyle: React.CSSProperties = {
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  borderRadius: 18,
  padding: 22,
}

const mutedTextStyle: React.CSSProperties = {
  color: "var(--muted)",
  lineHeight: 1.7,
}

const actionGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginTop: 18,
}

const actionButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "var(--button-foreground)",
  background: "var(--hero-background)",
  borderRadius: 14,
  padding: 14,
  textAlign: "center",
  fontWeight: "bold",
}

const layerStyle: React.CSSProperties = {
  background: "var(--card-background)",
  borderRadius: 16,
  padding: 16,
}

const priorityListStyle: React.CSSProperties = {
  lineHeight: 1.9,
  color: "var(--foreground)",
}