
import Link from "next/link"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import GlobalPulseBar from "@/components/admin/GlobalPulseBar"



async function logoutAction() {
  "use server"

  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()

  redirect("/login")
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="admin-shell" style={{ fontFamily: "Arial, sans-serif" }}>
      <header style={headerStyle}>
        <div>
          <strong>Echoes & Visions Admin</strong>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>{user.email}</p>
        </div>

        <nav style={navStyle}>
          <Link href="/admin" style={linkStyle}>Dashboard</Link>
          <Link href="/admin/articles" style={linkStyle}>Articles</Link>
          <Link href="/admin/ai-generator" style={linkStyle}>AI Generator</Link>
          <Link href="/admin/content-strategy" style={linkStyle}>Strategy</Link>
          <Link href="/admin/calendar" style={linkStyle}>Calendar</Link>
          <Link href="/admin/analytics" style={linkStyle}>Analytics</Link>
          <Link href="/blog" style={linkStyle}>View Blog</Link>
          <Link href="/admin/multi-agent" style={linkStyle}>Multi-Agent</Link>
          <Link href="/ask" style={linkStyle}>Ask AI</Link>
          <Link href="/admin/autonomous-pipeline" style={linkStyle}>Pipeline</Link>
          <Link href="/admin/memory" style={linkStyle}>Memory</Link>
          <Link href="/admin/jobs" style={linkStyle}>Jobs</Link>
          <Link href="/admin/activity" style={linkStyle}>Activity</Link>
          <Link href="/admin/executive-brain" style={linkStyle}>Executive Brain</Link>
          <Link href="/admin/self-improvement" style={linkStyle}>Self Improve</Link>
          <Link href="/admin/growth-intelligence" style={linkStyle}>Growth</Link>
          <Link href="/admin/crm" style={linkStyle}>CRM</Link>
          <Link href="/admin/workflows" style={linkStyle}>Workflows</Link>
          <Link href="/admin/agents" style={linkStyle}>Agents</Link>
          <Link href="/admin/operating-console" style={linkStyle}>Console</Link>
          <Link href="/admin/mission-chain" style={linkStyle}>Missions</Link>
          <Link href="/admin/tool-execution" style={linkStyle}>Tools</Link>
          <Link href="/admin/scheduler" style={linkStyle}>Scheduler</Link>
          <Link href="/admin/governance" style={linkStyle}>Governance</Link>
          <Link href="/admin/revenue" style={linkStyle}>Revenue</Link>
          <Link href="/admin/knowledge-graph" style={linkStyle}>Graph</Link>
          <Link href="/admin/simulation" style={linkStyle}>Simulation</Link>
          <Link href="/admin/voice-ops" style={linkStyle}>Voice Ops</Link>
          <Link href="/admin/live-command-center" style={linkStyle}>Live Center</Link> 
          <Link href="/admin/kernel" style={linkStyle}>Kernel</Link>
          <Link href="/admin/autonomous-execution" style={linkStyle}>Auto Exec</Link>
          <Link href="/admin/creator-leads" style={linkStyle}>Creator Leads</Link>
          <Link href="/admin/creator-nurture" style={linkStyle}>Creator Nurture</Link>
          <Link href="/admin/creator-audits" style={linkStyle}>Creator Audits</Link>
          <Link href="/admin/creator-automation-engine" style={linkStyle}>
          


  Creator Auto
</Link>

          <Link href="/admin/creator-revenue" style={linkStyle}>
  Revenue Ops
</Link>

<Link href="/admin/creator-command-center" style={linkStyle}>
  Creator Center
</Link>

<Link href="/admin/creator-learning" style={linkStyle}>
  Creator Learning
</Link>

<Link href="/admin/executive-agents" style={linkStyle}>
  Executive Agents
</Link>

<Link href="/admin/agent-collaboration" style={linkStyle}>
  Agent Boardroom
</Link>

<Link href="/admin/autonomous-missions" style={linkStyle}>
  Mission Cycles
</Link>

<Link href="/admin/operational-events" style={linkStyle}>
  Event Bus
</Link>

<Link href="/admin/tool-gateway" style={linkStyle}>
  Tool Gateway
</Link>

<Link href="/admin/optimization-engine" style={linkStyle}>
  Optimization
</Link>

<Link href="/admin/command-center-v2" style={linkStyle}>
  Command V2
</Link>

<Link href="/admin/executive-copilot" style={linkStyle}>
  Executive Copilot
</Link>

<Link href="/admin/external-operations" style={linkStyle}>
  External Ops
</Link>

<Link href="/admin/email-execution" style={linkStyle}>
  Email Ops
</Link>

<Link href="/admin/workflow-engine-v2" style={linkStyle}>
  Workflow Engine V2
</Link>

<Link href="/admin/orchestration-kernel" style={linkStyle}>
  Orchestration Kernel
</Link>

<Link href="/admin/persistent-runtime" style={linkStyle}>
  Runtime
</Link>

<Link href="/admin/adaptive-evolution" style={linkStyle}>
  Evolution
</Link>

<Link href="/admin/strategic-director" style={linkStyle}>
  Strategic Director
</Link>

<Link href="/admin/governance-matrix" style={linkStyle}>
  Governance Matrix
</Link>

<Link href="/admin/global-intelligence" style={linkStyle}>
  Global Intel
</Link>

<Link href="/admin/cognitive-fabric" style={linkStyle}>
  Cognitive Fabric
</Link>

<Link href="/admin/executive-operations" style={linkStyle}>
  Executive Ops
</Link>

<Link href="/admin/economic-intelligence" style={linkStyle}>
  Economic Intel
</Link>

<Link href="/admin/temporal-intelligence" style={linkStyle}>
  Temporal Intel
</Link>

<Link href="/admin/federated-intelligence" style={linkStyle}>
  Federation
</Link>

<Link href="/admin/recursive-evolution" style={linkStyle}>
  Evolution
</Link>

<Link href="/admin/world-model" style={linkStyle}>
  World Model
</Link>

<Link href="/admin/world-model-v2" style={linkStyle}>
  World Model V2
</Link>

<Link href="/admin/sovereign-runtime" style={linkStyle}>
  Sovereign Runtime
</Link>

<Link href="/admin/enterprise-governance" style={linkStyle}>
  Enterprise Governance
</Link>

<Link href="/admin/infrastructure-resilience" style={linkStyle}>
  Infrastructure
</Link>

<Link href="/admin/tenant-runtime" style={linkStyle}>
  Tenant Runtime
</Link>

<Link href="/admin/identity-runtime" style={linkStyle}>
  Identity
</Link>

<Link href="/admin/realtime-fabric" style={linkStyle}>
  Realtime Fabric
</Link>

<Link href="/admin/billing-runtime" style={linkStyle}>
  Billing
</Link>

<Link href="/admin/knowledge-graph" style={linkStyle}>
  Knowledge Graph
</Link>

<Link href="/admin/reasoning-engine" style={linkStyle}>
  Reasoning
</Link>

<Link href="/admin/action-engine" style={linkStyle}>
  Action Engine
</Link>

<Link href="/admin/evolution-engine" style={linkStyle}>
  Evolution Engine
</Link>

<Link href="/admin/federated-mesh" style={linkStyle}>
  Federated Mesh
</Link>

<Link href="/admin/content-os" style={linkStyle}>
  Content OS
</Link>

<Link href="/admin/publishing-command" style={linkStyle}>
  Publishing Command
</Link>

<Link href="/admin/audience-intelligence" style={linkStyle}>
  Audience Intel
</Link>



          <form action={logoutAction}>
            <button style={logoutButton}>Logout</button>
          </form>
        </nav>
      </header>

      {children}
    </div>
  )
}


const headerStyle: React.CSSProperties = {
  padding: "18px 40px",
  borderBottom: "1px solid var(--border)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  flexWrap: "wrap",
  background: "var(--card-background)",
  color: "var(--foreground)",
}

const navStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
}

const linkStyle: React.CSSProperties = {
  color: "var(--foreground)",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: 14,
}

const logoutButton: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  background: "var(--button-background)",
  color: "var(--button-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}