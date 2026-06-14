import { buildExecutiveMemory } from "./executive-memory";

export async function buildExecutiveLearningV2() {
  const memory = await buildExecutiveMemory();

  const healthEvents = memory.memories.filter(
    (m) => m.category === "health"
  );

  const strategyEvents = memory.memories.filter(
    (m) => m.category === "strategy"
  );

  const lessons: string[] = [];

  if (healthEvents.length > 0) {
    lessons.push(
      "Executive health declines should trigger recovery mode earlier."
    );
  }

  if (strategyEvents.length > 0) {
    lessons.push(
      "Cashflow, delivery execution and recurring revenue are the strongest current strategic levers."
    );
  }

  return {
    version: "v2",
    learningScore: Math.min(100, 60 + lessons.length * 15),
    totalLessons: lessons.length,
    lessons,
    sourceMemoryCount: memory.total,
    generatedAt: new Date().toISOString(),
  };
}