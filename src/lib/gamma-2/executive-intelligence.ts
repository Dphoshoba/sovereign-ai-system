export type ExecutiveSignalKind = "task" | "mission" | "risk" | "opportunity";

export interface ExecutiveSignal {
  id: string;
  kind: ExecutiveSignalKind;
  title: string;
  owner: string;
  status: "open" | "blocked" | "complete";
  dueAt: Date;
  expectedRoi: number;
  riskScore: number;
  effortScore: number;
}

export interface ExecutiveIntelligenceInput {
  briefId: string;
  currentTime: Date;
  signals: ExecutiveSignal[];
}

export interface ExecutivePriorityItem {
  id: string;
  title: string;
  owner: string;
  reason: string;
  priorityScore: number;
}

export interface ExecutiveIntelligenceBrief {
  id: string;
  briefId: string;
  generatedAt: Date;
  answers: {
    blocked: ExecutivePriorityItem[];
    overdue: ExecutivePriorityItem[];
    highestRoi: ExecutivePriorityItem[];
    risks: ExecutivePriorityItem[];
    today: ExecutivePriorityItem[];
  };
  executiveRule: "answer-first-deterministic-brief";
}

function clampScore(score: number): number {
  if (score < 0) return 0;
  if (score > 100) return 100;
  return Math.round(score);
}

function daysBetween(a: Date, b: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((a.getTime() - b.getTime()) / millisecondsPerDay);
}

function normalizeSignals(signals: ExecutiveSignal[]): ExecutiveSignal[] {
  return [...signals].sort((a, b) => a.id.localeCompare(b.id));
}

function toPriorityItem(
  signal: ExecutiveSignal,
  reason: string,
  priorityScore: number
): ExecutivePriorityItem {
  return {
    id: signal.id,
    title: signal.title,
    owner: signal.owner,
    reason,
    priorityScore: clampScore(priorityScore),
  };
}

function sortByPriority(items: ExecutivePriorityItem[]): ExecutivePriorityItem[] {
  return [...items].sort((a, b) => {
    const scoreDelta = b.priorityScore - a.priorityScore;
    if (scoreDelta !== 0) return scoreDelta;
    return a.id.localeCompare(b.id);
  });
}

export function buildExecutiveIntelligenceBrief(
  input: ExecutiveIntelligenceInput
): ExecutiveIntelligenceBrief {
  const currentTime = new Date(input.currentTime);
  const signals = normalizeSignals(input.signals).filter((signal) => signal.status !== "complete");
  const blocked = signals
    .filter((signal) => signal.status === "blocked")
    .map((signal) =>
      toPriorityItem(signal, "Blocked work requires executive removal.", signal.riskScore + 20)
    );
  const overdue = signals
    .filter((signal) => signal.dueAt.getTime() < currentTime.getTime())
    .map((signal) => {
      const overdueDays = daysBetween(currentTime, signal.dueAt);
      return toPriorityItem(
        signal,
        `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue.`,
        signal.riskScore + overdueDays * 6
      );
    });
  const highestRoi = signals.map((signal) =>
    toPriorityItem(
      signal,
      "High expected return relative to effort.",
      signal.expectedRoi - signal.effortScore + 50
    )
  );
  const risks = signals
    .filter((signal) => signal.riskScore >= 60 || signal.status === "blocked")
    .map((signal) =>
      toPriorityItem(signal, "Elevated delivery or governance risk.", signal.riskScore)
    );
  const today = signals
    .filter((signal) => {
      const dueDays = daysBetween(signal.dueAt, currentTime);
      return signal.status === "blocked" || dueDays <= 1 || signal.expectedRoi >= 80;
    })
    .map((signal) =>
      toPriorityItem(
        signal,
        "Recommended for today's executive operating rhythm.",
        signal.expectedRoi + signal.riskScore - signal.effortScore
      )
    );

  return {
    id: `executive_brief_${input.briefId}`,
    briefId: input.briefId,
    generatedAt: currentTime,
    answers: {
      blocked: sortByPriority(blocked),
      overdue: sortByPriority(overdue),
      highestRoi: sortByPriority(highestRoi).slice(0, 3),
      risks: sortByPriority(risks),
      today: sortByPriority(today),
    },
    executiveRule: "answer-first-deterministic-brief",
  };
}

export function buildPhaseXXIIIReadiness(): {
  phase: "XXIII";
  name: "Executive Intelligence";
  answers: Array<keyof ExecutiveIntelligenceBrief["answers"]>;
  executiveRule: "answer-first-deterministic-brief";
} {
  return {
    phase: "XXIII",
    name: "Executive Intelligence",
    answers: ["blocked", "overdue", "highestRoi", "risks", "today"],
    executiveRule: "answer-first-deterministic-brief",
  };
}
