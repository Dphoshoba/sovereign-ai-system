import { buildExecutiveHealth } from "./executive-health";
import { buildExecutiveAlerts } from "./executive-alerts";

export async function buildExecutiveAutopilot() {
  const [health, alerts] = await Promise.all([
    buildExecutiveHealth(),
    buildExecutiveAlerts(),
  ]);

  const actions: string[] = [];

  if (health.overallHealth < 40) {
    actions.push("Activate recovery mode");
  }

  if (alerts.critical > 0) {
    actions.push("Escalate critical executive alerts");
  }

  if (health.finance < 60) {
    actions.push("Prioritize collections");
  }

  if (health.operations < 60) {
    actions.push("Resolve delivery bottlenecks");
  }

  return {
    status:
      actions.length > 0
        ? "action_required"
        : "stable",

    actions,

    generatedAt: new Date().toISOString(),
  };
}