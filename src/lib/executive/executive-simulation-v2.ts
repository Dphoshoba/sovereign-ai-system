import { buildExecutiveDecisionEngineV2 } from "./executive-decision-engine-v2";

export async function buildExecutiveSimulationV2() {
  const decisions =
    await buildExecutiveDecisionEngineV2();

  const scenarios = [
    {
      name: "Revenue Recovery First",
      projectedHealth: 70,
      confidence: 85,
      summary:
        "Focus on collections, recurring revenue and proposal conversion.",
    },

    {
      name: "Operations Recovery First",
      projectedHealth: 75,
      confidence: 90,
      summary:
        "Reduce delivery bottlenecks and complete overdue projects.",
    },

    {
      name: "Expansion First",
      projectedHealth: 45,
      confidence: 60,
      summary:
        "Pursue growth before operational recovery.",
    },
  ];

  const bestScenario = scenarios.reduce(
    (best, current) =>
      current.projectedHealth >
      best.projectedHealth
        ? current
        : best
  );

  return {
    version: "v2",

    decisionConfidence:
      decisions.confidence,

    scenarios,

    recommendedScenario:
      bestScenario,

    generatedAt:
      new Date().toISOString(),
  };
}