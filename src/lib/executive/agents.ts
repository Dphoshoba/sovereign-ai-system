import { buildCfoIntelligence } from "./cfo-intelligence"
import { buildCooIntelligence } from "./coo-intelligence"
import { buildRevenueIntelligence } from "./revenue-intelligence"

export type ExecutiveAgentResponse = {
  agent: string
  health: number
  priorities: string[]
  risks: string[]
  opportunities: string[]
  recommendations: string[]
}

export async function buildExecutiveAgents() {
  const cfo = await buildCfoIntelligence()
  const coo = await buildCooIntelligence()
  const revenue = await buildRevenueIntelligence()

  const ceo: ExecutiveAgentResponse = {
    agent: "CEO",
    health: Math.round((cfo.financialHealth + coo.operationsHealth) / 2),
    priorities: ["Revenue Growth", "Operational Execution", "Client Expansion"],
    risks: [...cfo.risks.map(r => r.title), ...coo.risks.map(r => r.title)].slice(0, 5),
    opportunities: [...cfo.opportunities.map(o => o.title), ...coo.opportunities.map(o => o.title)].slice(0, 5),
    recommendations: [...cfo.recommendations, ...coo.recommendations].slice(0, 5),
  }

  const cfoAgent: ExecutiveAgentResponse = {
    agent: "CFO",
    health: cfo.financialHealth,
    priorities: ["Cashflow", "Collections", "Forecasting"],
    risks: cfo.risks.map(r => r.title),
    opportunities: cfo.opportunities.map(o => o.title),
    recommendations: cfo.recommendations,
  }

  const cooAgent: ExecutiveAgentResponse = {
    agent: "COO",
    health: coo.operationsHealth,
    priorities: ["Delivery", "Projects", "Execution"],
    risks: coo.risks.map(r => r.title),
    opportunities: coo.opportunities.map(o => o.title),
    recommendations: coo.recommendations,
  }

  const cmoAgent: ExecutiveAgentResponse = {
    agent: "CMO",
    health: revenue.revenueHealth,
    priorities: ["Lead Generation", "Pipeline Growth", "Proposal Conversion"],
    risks: revenue.risks.map(r => r.title),
    opportunities: revenue.opportunities.map(o => o.title),
    recommendations: [
      "Increase proposal conversion",
      "Follow up qualified leads",
      "Grow client acquisition channels",
    ],
  }

  const ctoAgent: ExecutiveAgentResponse = {
    agent: "CTO",
    health: 85,
    priorities: ["Platform Stability", "Automation", "Knowledge Graph"],
    risks: ["Technical debt", "Platform scaling"],
    opportunities: ["Executive automation", "Agent orchestration"],
    recommendations: [
      "Expand automation coverage",
      "Reduce manual workflows",
    ],
  }

  return {
    ceo,
    cfo: cfoAgent,
    coo: cooAgent,
    cmo: cmoAgent,
    cto: ctoAgent,
  }
}