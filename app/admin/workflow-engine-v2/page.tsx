"use client"

import { useEffect, useState } from "react"
import {
  PageShell,
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  StatusBadge,
} from "@/components/executive-ui"

type Workflow = {
  id: string
  name: string
  description: string
  triggerType: string
  enabled: boolean
}

type Execution = {
  id: string
  workflowName: string
  triggerType: string
  status: string
  currentStep: string | null
  createdAt: string
}

type Action = {
  id: string
  title: string
  actionType: string
  status: string
  createdAt: string
}

export default function WorkflowEngineV2Page() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [executions, setExecutions] = useState<Execution[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/workflow-engine")
    const result = await res.json()

    if (result.ok) {
      setWorkflows(result.workflows)
      setExecutions(result.executions)
      setActions(result.actions)
    }
  }

  async function triggerWorkflow(triggerType: string) {
    setLoading(true)

    const res = await fetch("/api/workflow-engine", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        triggerType,
        source: "workflow-engine-admin",
        payload: {
          email: "dphogeorge@gmail.com",
          leadScore: 90,
          readiness: "urgent",
        },
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Workflow execution failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <PageShell
      eyebrow="Autonomous Operations"
      title="AI Workflow Automation Engine V2"
      description="Connect operational events to intelligent autonomous workflows, agent coordination, mission generation and governed execution."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Workflows" value={workflows.length} />
        <MetricCard label="Executions" value={executions.length} />
        <MetricCard label="Workflow Actions" value={actions.length} />
        <MetricCard
          label="Completed"
          value={executions.filter((e) => e.status === "completed").length}
        />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Workflow Registry" eyebrow="Automation systems">
            <div style={{ display: "grid", gap: 14 }}>
              {workflows.map((workflow) => (
                <div key={workflow.id} style={cardStyle}>
                  <StatusBadge
                    status={workflow.enabled ? "active" : "disabled"}
                  />

                  <h3>{workflow.name}</h3>

                  <p>{workflow.description}</p>

                  <p style={{ color: "#666" }}>
                    Trigger: {workflow.triggerType}
                  </p>

                  <button
                    disabled={loading}
                    onClick={() =>
                      triggerWorkflow(workflow.triggerType)
                    }
                    style={buttonStyle}
                  >
                    Trigger Workflow
                  </button>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Execution Stream" eyebrow="Workflow runtime">
            <div style={{ display: "grid", gap: 12 }}>
              {executions.map((execution) => (
                <div key={execution.id} style={cardStyle}>
                  <StatusBadge status={execution.status} />

                  <h3>{execution.workflowName}</h3>

                  <p>
                    Trigger: {execution.triggerType}
                  </p>

                  <p>
                    Current Step: {execution.currentStep || "Completed"}
                  </p>

                  <p style={{ color: "#777", fontSize: 12 }}>
                    {new Date(execution.createdAt).toLocaleString("en-AU")}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Workflow Actions" eyebrow="Action orchestration">
          <div style={{ display: "grid", gap: 12 }}>
            {actions.map((action) => (
              <div key={action.id} style={cardStyle}>
                <StatusBadge status={action.status} />

                <h3>{action.title}</h3>

                <p>{action.actionType}</p>

                <p style={{ color: "#777", fontSize: 12 }}>
                  {new Date(action.createdAt).toLocaleString("en-AU")}
                </p>
              </div>
            ))}
          </div>
        </ExecutiveCard>
      </div>
    </PageShell>
  )
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 16,
  padding: 18,
  background: "#fafafa",
}