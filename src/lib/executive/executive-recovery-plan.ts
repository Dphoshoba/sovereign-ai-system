import { buildExecutiveScorecard } from "./executive-scorecard";
import { buildExecutiveAlerts } from "./executive-alerts";
import { buildStrategicDirector } from "./strategic-director";

export async function buildExecutiveRecoveryPlan() {
  const [scorecard, alerts, director] = await Promise.all([
    buildExecutiveScorecard(),
    buildExecutiveAlerts(),
    buildStrategicDirector(),
  ]);

  return {
    status: scorecard.status,
    overallHealth: scorecard.overallHealth,
    recoveryMode:
      scorecard.overallHealth < 40 ? "critical_recovery" : "standard_recovery",

    immediateActions: [
      "Collect outstanding invoices",
      "Resolve overdue projects",
      "Review blocked approval actions",
      "Run executive recovery meeting",
    ],

    financeRecovery: [
      "Prioritize collections this week",
      "Introduce deposits or milestone invoicing",
      "Convert sent proposals with start dates",
    ],

    operationsRecovery: [
      "Clear overdue project bottlenecks",
      "Reduce active work-in-progress",
      "Push closest project to completion",
    ],

    strategyRecovery: director.next30Days,

    alertCount: alerts.total,
    criticalAlerts: alerts.critical,

    successCriteria: [
      "Overall health above 50",
      "Operations health above 40",
      "Pending approvals reduced below 2",
      "At least one major revenue action completed",
    ],

    generatedAt: new Date().toISOString(),
  };
}