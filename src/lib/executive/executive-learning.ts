import { buildExecutiveMemory } from "./executive-memory";

export async function buildExecutiveLearning() {
  const memory = await buildExecutiveMemory();

  const lessons: string[] = [];

  const healthEvents = memory.memories.filter(
    (m) => m.category === "health"
  );

  const strategyEvents = memory.memories.filter(
    (m) => m.category === "strategy"
  );

  if (healthEvents.length > 0) {
    lessons.push(
      "Executive health declines require earlier intervention."
    );
  }

  if (strategyEvents.length > 0) {
    lessons.push(
      "Revenue and delivery execution consistently influence company health."
    );
  }

  return {
    totalLessons: lessons.length,
    lessons,
    generatedAt: new Date().toISOString(),
  };
}