import { buildExecutiveForecastingV2 } from "./executive-forecasting-v2";

export async function buildExecutiveDecisionEngineV2() {
  const forecast =
    await buildExecutiveForecastingV2();

  const decisions: string[] = [];

  if (forecast.currentHealth < 50) {
    decisions.push(
      "Prioritize recovery actions before expansion initiatives."
    );
  }

  if (forecast.forecast.next90Days > 60) {
    decisions.push(
      "Continue investing in revenue growth and automation systems."
    );
  }

  if (
    forecast.riskOutlook.includes("High risk")
  ) {
    decisions.push(
      "Schedule an executive recovery review within 7 days."
    );
  }

  return {
    version: "v2",

    decisionScore:
      forecast.forecast.next90Days,

    recommendedDecisions:
      decisions,

    confidence:
      forecast.learningScore,

    generatedAt:
      new Date().toISOString(),
  };
}