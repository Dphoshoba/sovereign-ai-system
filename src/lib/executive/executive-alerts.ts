import { buildExecutiveHealth } from "./executive-health";

export async function buildExecutiveAlerts() {
  const health = await buildExecutiveHealth();

  const alerts: {
    id: string;
    title: string;
    severity: "info" | "warning" | "critical";
    message: string;
    recommendedAction: string;
  }[] = [];

  if (health.overallHealth < 40) {
    alerts.push({
      id: "critical-executive-health",
      title: "Executive health is critical",
      severity: "critical",
      message: `Overall health is ${health.overallHealth}/100.`,
      recommendedAction:
        "Run an executive recovery review and prioritize cashflow, delivery and strategy alignment.",
    });
  }

  if (health.finance < 60) {
    alerts.push({
      id: "finance-warning",
      title: "Finance needs attention",
      severity: "warning",
      message: `Finance health is ${health.finance}/100.`,
      recommendedAction:
        "Prioritize collections, milestone invoicing and recurring revenue.",
    });
  }

  if (health.operations < 60) {
    alerts.push({
      id: "operations-warning",
      title: "Operations need attention",
      severity: "warning",
      message: `Operations health is ${health.operations}/100.`,
      recommendedAction:
        "Resolve overdue projects and reduce delivery bottlenecks.",
    });
  }

  if (health.strategy < 60) {
    alerts.push({
      id: "strategy-warning",
      title: "Strategy needs attention",
      severity: "warning",
      message: `Strategy health is ${health.strategy}/100.`,
      recommendedAction:
        "Focus the next 30 days on fewer priorities with clearer execution targets.",
    });
  }

  return {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    warnings: alerts.filter((a) => a.severity === "warning").length,
    info: alerts.filter((a) => a.severity === "info").length,
    alerts,
    generatedAt: new Date().toISOString(),
  };
}