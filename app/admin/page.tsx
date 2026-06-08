import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function AiCommandCenterPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
  })

  const memories = await prisma.aiMemory.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const total = articles.length
  const published = articles.filter((a) => a.status === "published").length
  const drafts = articles.filter((a) => a.status === "draft").length
  const reviews = articles.filter((a) => a.status === "review").length
  const scheduled = articles.filter((a) => a.status === "scheduled").length

  const recentArticles = articles.slice(0, 5)
  const nextScheduled = articles
    .filter((a) => a.status === "scheduled" && a.scheduledFor)
    .sort(
      (a, b) =>
        new Date(a.scheduledFor!).getTime() -
        new Date(b.scheduledFor!).getTime()
    )
    .slice(0, 3)

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Echoes & Visions</p>
        <h1 style={{ fontSize: 44, lineHeight: 1.08, margin: "10px 0" }}>
          AI Command Center
        </h1>
        <p style={{ maxWidth: 780, color: "var(--hero-muted)", lineHeight: 1.7 }}>
          One operational cockpit for publishing, strategy, memory, agents,
          analytics, scheduling, semantic search and knowledge intelligence.
        </p>
      </section>

      <section style={statsGrid}>
        <StatCard label="Total Articles" value={total} />
        <StatCard label="Published" value={published} />
        <StatCard label="Drafts" value={drafts} />
        <StatCard label="Reviews" value={reviews} />
        <StatCard label="Scheduled" value={scheduled} />
        <StatCard label="Memories" value={memories.length} />
      </section>

      <section style={quickActions}>
        <ActionButton href="/admin/autonomous-pipeline" label="Run Pipeline" />
        <ActionButton href="/admin/multi-agent" label="Run Agents" />
        <ActionButton href="/admin/ai-generator" label="Generate Article" />
        <ActionButton href="/ask" label="Ask Knowledge Base" />
        <ActionButton href="/admin/memory" label="Save Memory" />
        <ActionButton href="/admin/calendar" label="View Calendar" />
      </section>

      <section style={gridTwo}>
        <Panel title="AI Workflows">
          <CommandCard
            title="Autonomous Pipeline"
            description="Generate article, SEO, thumbnail idea, social posts and newsletter copy."
            href="/admin/autonomous-pipeline"
          />

          <CommandCard
            title="Multi-Agent Workflow"
            description="Run Research, SEO, Editor, Thumbnail and Publishing agents together."
            href="/admin/multi-agent"
          />

          <CommandCard
            title="AI Article Generator"
            description="Create draft or published articles using the Echoes & Visions writing DNA."
            href="/admin/ai-generator"
          />

          <CommandCard
           title="Content Strategy Engine"
           description="Generate pillar topics, article ideas, gaps and next best content moves."
           href="/admin/content-strategy"
          />

         <CommandCard
          title="AI Executive Brain"
          description="Analyze the whole platform and recommend strategic next moves."
          href="/admin/executive-brain"
         />       

         
        </Panel>

        <Panel title="Publishing Operations">
          <CommandCard
            title="Articles"
            description="Create, edit, publish, schedule and delete articles."
            href="/admin/articles"
          />

          <CommandCard
            title="Editorial Calendar"
            description="Track scheduled posts, drafts, reviews and published content."
            href="/admin/calendar"
          />

          <CommandCard
            title="Analytics"
            description="Review content health, categories, keywords and publishing activity."
            href="/admin/analytics"
          />

          <CommandCard
            title="Public Blog"
            description="Preview the live public publishing experience."
            href="/blog"
          />
        </Panel>
      </section>

      <section style={gridTwo}>
        <Panel title="Recent Articles">
          {recentArticles.length === 0 ? (
            <p>No articles yet.</p>
          ) : (
            recentArticles.map((article) => (
              <Link
                key={article.id}
                href={`/admin/articles/${article.id}/edit`}
                style={listItem}
              >
                <span>
                  <strong>{article.title}</strong>
                  <br />
                  <small>
                    {article.category} · {article.status}
                  </small>
                </span>
                <span>Open →</span>
              </Link>
            ))
          )}
        </Panel>

        <Panel title="Upcoming Scheduled Posts">
          {nextScheduled.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No scheduled posts yet.</p>
          ) : (
            nextScheduled.map((article) => (
              <Link
                key={article.id}
                href={`/admin/articles/${article.id}/edit`}
                style={listItem}
              >
                <span>
                  <strong>{article.title}</strong>
                  <br />
                  <small>
                    {article.scheduledFor
                      ? new Date(article.scheduledFor).toLocaleString("en-AU")
                      : "No date"}
                  </small>
                </span>
                <span>Edit →</span>
              </Link>
            ))
          )}
        </Panel>
      </section>

      <section style={gridTwo}>
        <Panel title="Recent AI Memories">
          {memories.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No memories saved yet.</p>
          ) : (
            memories.map((memory) => (
              <div key={memory.id} style={memoryItem}>
                <p style={metaStyle}>{memory.type}</p>
                <strong>{memory.title}</strong>
                <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                  {memory.content.slice(0, 180)}
                  {memory.content.length > 180 ? "..." : ""}
                </p>
              </div>
            ))
          )}

          <Link href="/admin/memory" style={plainLink}>
            Open Memory →
          </Link>
        </Panel>

        <Panel title="Knowledge Intelligence">
          <CommandCard
            title="Ask AI Knowledge Base"
            description="Ask questions against published articles using semantic retrieval and RAG."
            href="/ask"
          />

          <CommandCard
            title="Semantic Search"
            description="Use embeddings to find articles by meaning, not just keywords."
            href="/ask"
          />
          <CommandCard
           title="AI Self-Improvement"
           description="Review system outputs and recommend prompt, SEO, workflow and memory improvements."
           href="/admin/self-improvement"
         />
          <CommandCard
           title="AI Growth Intelligence"
           description="Identify revenue opportunities, lead magnets, funnels, CTAs and growth moves."
           href="/admin/growth-intelligence"
          /> 

         <CommandCard
           title="AI Tool Execution"
           description="Execute approved internal actions such as memory, jobs, activity and CRM updates."
           href="/admin/tool-execution"
          />

          <CommandCard
           title="AI Simulation Engine"
           description="Run strategic scenario planning for growth, revenue, content and ministry decisions."
           href="/admin/simulation"
          />

          <CommandCard
           title="AI Voice Operations"
           description="Speak or type commands to the Echoes & Visions AI organization."
           href="/admin/voice-ops"
          />

          <CommandCard
           title="Live AI Command Center"
           description="Monitor agents, jobs, workflows, approvals, schedules and activity in real time."
           href="/admin/live-command-center"
          />

          <CommandCard
           title="AI Orchestration Kernel"
           description="Route missions through agents, workflows, memory, governance and tools."
           href="/admin/kernel"
          />
          
          <CommandCard
            title="Memory System"
            description="Store long-term strategy, voice, audience and publishing context."
            href="/admin/memory"
          />
        </Panel>
      </section>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={statCard}>
      <strong style={{ fontSize: 30 }}>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function ActionButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={actionButton}>
      {label}
    </Link>
  )
}

function Panel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section style={panelStyle}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div style={{ display: "grid", gap: 14 }}>{children}</div>
    </section>
  )
}

function CommandCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <Link href={href} style={commandCard}>
      <strong>{title}</strong>
      <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: 0 }}>
        {description}
      </p>
    </Link>
  )
}
   
const heroStyle: React.CSSProperties = {
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  borderRadius: 24,
  padding: 34,
}

const eyebrowStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--muted)",
  margin: 0,
}

const statsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 16,
  marginTop: 24,
}

const statCard: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 22,
  display: "grid",
  gap: 8,
}

const quickActions: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 24,
  marginBottom: 24,
}

const actionButton: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  textDecoration: "none",
  fontWeight: "bold",
}

const gridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 22,
  marginTop: 24,
}

const panelStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 20,
  padding: 24,
}

const commandCard: React.CSSProperties = {
  display: "block",
  padding: 18,
  borderRadius: 14,
  background: "var(--card-background)",
  color: "var(--foreground)",
  textDecoration: "none",
  border: "1px solid var(--border)",
}

const listItem: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 18,
  padding: 16,
  borderRadius: 14,
  background: "var(--card-background)",
  color: "var(--foreground)",
  textDecoration: "none",
  border: "1px solid var(--border)",
}

const memoryItem: React.CSSProperties = {
  padding: 16,
  borderRadius: 14,
  background: "var(--card-background)",
  border: "1px solid var(--border)",
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--muted)",
  fontSize: 13,
  marginTop: 0,
}

const plainLink: React.CSSProperties = {
  color: "var(--foreground)",
  fontWeight: "bold",
  textDecoration: "none",
}