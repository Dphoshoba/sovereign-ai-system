"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function EvolutionEnginePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/evolution-engine")
    const result = await res.json()

    if (result.ok) setData(result)
  }

  async function runEvolution() {
    setLoading(true)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120000)

      const res = await fetch("/api/evolution-engine", {
        method: "POST",
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const result = await res.json()

      if (!result.ok) {
        alert(result.error || "Evolution run failed")
        return
      }

      await loadData()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Evolution run stopped unexpectedly"
      )
    } finally {
      setLoading(false)
    }
  }

  async function activateProposal(proposalId: string) {
    setLoading(true)

    try {
      const res = await fetch("/api/evolution-engine/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ proposalId }),
      })

      const result = await res.json()

      if (!result.ok) {
        alert(result.error || "Proposal activation failed")
        return
      }

      await loadData()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Proposal activation failed"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const runs = data?.runs || []
  const proposals = data?.proposals || []
  const agents = data?.agents || []
  const workflows = data?.workflows || []
  const memories = data?.memories || []

  const latest = runs[0]

  return (
    <PageShell
      eyebrow="Adaptive Institutional Evolution"
      title="Recursive Self-Optimization Engine"
      description="Analyze execution outcomes, workflows, governance pressure and agent coordination to evolve institutional intelligence continuously."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Evolution Runs" value={runs.length} />
        <MetricCard label="Optimization Proposals" value={proposals.length} />
        <MetricCard label="Agent Profiles" value={agents.length} />
        <MetricCard label="Workflow Patterns" value={workflows.length} />
        <MetricCard label="Evolution Memories" value={memories.length} />
        <MetricCard
          label="Optimization Health"
          value={latest?.optimizationHealth || 0}
        />
        <MetricCard
          label="Adaptation Score"
          value={latest?.adaptationScore || 0}
        />
        <MetricCard
          label="Institutional Maturity"
          value={latest?.institutionalMaturity || 0}
        />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard
          title="Institutional Evolution Runtime"
          eyebrow="Recursive optimization"
        >
          <button disabled={loading} onClick={runEvolution} style={buttonStyle}>
            {loading ? "Optimizing..." : "Run Evolution Engine"}
          </button>

          {latest ? (
            <div style={cardStyle}>
              <StatusBadge status={latest.status} />
              <h3>{latest.title}</h3>
              <p>{latest.summary}</p>

              <p style={{ color: "var(--muted)" }}>
                Optimization {latest.optimizationHealth}/100 · Adaptation{" "}
                {latest.adaptationScore}/100 · Execution{" "}
                {latest.executionEfficiency}/100
              </p>

              <pre style={preStyle}>
                {JSON.stringify(latest.findings, null, 2)}
              </pre>
            </div>
          ) : null}
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard
            title="Optimization Proposals"
            eyebrow="Institutional improvements"
          >
            <div style={{ display: "grid", gap: 12 }}>
              {proposals.map((proposal: any) => (
                <div key={proposal.id} style={cardStyle}>
                  <StatusBadge status={proposal.status} />

                  <h3>{proposal.title}</h3>

                  <p>{proposal.description}</p>

                  <p>
                    <strong>Expected impact:</strong>{" "}
                    {proposal.expectedImpact}
                  </p>

                  <p style={{ color: "var(--muted)" }}>
                    {proposal.targetLayer} · Optimization{" "}
                    {proposal.optimizationValue}/100 · Effort{" "}
                    {proposal.implementationEffort}/100
                  </p>

                  {proposal.status === "proposed" ? (
                    <button
                      disabled={loading}
                      onClick={() => activateProposal(proposal.id)}
                      style={buttonStyle}
                    >
                      Activate Proposal
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard
            title="Agent Performance"
            eyebrow="Adaptive coordination"
          >
            <div style={{ display: "grid", gap: 12 }}>
              {agents.map((agent: any) => (
                <div key={agent.id} style={cardStyle}>
                  <StatusBadge status={agent.agentRole} />

                  <h3>{agent.agentName}</h3>

                  <p style={{ color: "var(--muted)" }}>
                    Execution {agent.executionScore}/100 · Governance{" "}
                    {agent.governanceScore}/100 · Adaptation{" "}
                    {agent.adaptationScore}/100
                  </p>

                  <p>
                    <strong>Strengths:</strong>{" "}
                    {(agent.strengths || []).join(", ")}
                  </p>

                  <p>
                    <strong>Weaknesses:</strong>{" "}
                    {(agent.weaknesses || []).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard
            title="Workflow Evolution"
            eyebrow="Operational bottlenecks"
          >
            <div style={{ display: "grid", gap: 12 }}>
              {workflows.map((workflow: any) => (
                <div key={workflow.id} style={cardStyle}>
                  <StatusBadge status={workflow.workflowType} />

                  <h3>{workflow.workflowName}</h3>

                  <p>{workflow.optimizationSuggestion}</p>

                  <p style={{ color: "var(--muted)" }}>
                    Efficiency {workflow.efficiencyScore}/100 · Automation{" "}
                    {workflow.automationPotential}/100 · Bottleneck{" "}
                    {workflow.bottleneckRisk}/100
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard
            title="Evolution Memory"
            eyebrow="Institutional learning"
          >
            <div style={{ display: "grid", gap: 12 }}>
              {memories.map((memory: any) => (
                <div key={memory.id} style={cardStyle}>
                  <StatusBadge status={memory.evolutionType} />

                  <h3>{memory.title}</h3>

                  <p>{memory.summary}</p>

                  <p style={{ color: "var(--muted)" }}>
                    Impact Area: {memory.impactArea} · Delta{" "}
                    {memory.improvementDelta}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>
    </PageShell>
  )
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 18,
  background: "var(--card-background)",
}

const preStyle: React.CSSProperties = {
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  padding: 14,
  borderRadius: 14,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
}