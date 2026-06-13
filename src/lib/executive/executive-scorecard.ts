import { buildExecutiveHealth } from "./executive-health";
import { buildExecutiveAlerts } from "./executive-alerts";
import { buildStrategicDirector } from "./strategic-director";

export async function buildExecutiveScorecard() {
  const [health, alerts, director] =
    await Promise.all([
      buildExecutiveHealth(),
      buildExecutiveAlerts(),
      buildStrategicDirector(),
    ]);

  return {
    overallHealth: health.overallHealth,
    status: health.status,

    finance: health.finance,
    operations: health.operations,
    strategy: health.strategy,

    criticalAlerts: alerts.critical,
    totalAlerts: alerts.total,

    priorities: director.priorities,
    risks: director.risks,

    next30Days: director.next30Days,
    next60Days: director.next60Days,
    next90Days: director.next90Days,

    generatedAt: new Date().toISOString(),
  };
}