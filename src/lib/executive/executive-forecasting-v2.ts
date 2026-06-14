import { buildExecutiveScorecard } from "./executive-scorecard";
import { buildExecutiveLearningV2 } from "./executive-learning-v2";

export async function buildExecutiveForecastingV2() {
  const [scorecard, learning] = await Promise.all([
    buildExecutiveScorecard(),
    buildExecutiveLearningV2(),
  ]);

  const projectedHealth30 =
    scorecard.overallHealth < 50
      ? scorecard.overallHealth + 10
      : scorecard.overallHealth + 5;

  const projectedHealth60 =
    projectedHealth30 + 10;

  const projectedHealth90 =
    projectedHealth60 + 10;

  return {
    version: "v2",
    currentHealth: scorecard.overallHealth,
    currentStatus: scorecard.status,
    learningScore: learning.learningScore,

    forecast: {
      next30Days: Math.min(100, projectedHealth30),
      next60Days: Math.min(100, projectedHealth60),
      next90Days: Math.min(100, projectedHealth90),
    },

    assumptions: [
      "Recovery actions are executed within the next 30 days.",
      "Revenue collection improves cashflow pressure.",
      "Delivery bottlenecks are reduced through task prioritization.",
    ],

    riskOutlook:
      scorecard.overallHealth < 40
        ? "High risk unless recovery actions are executed."
        : "Moderate risk with stable improvement expected.",

    generatedAt: new Date().toISOString(),
  };
}