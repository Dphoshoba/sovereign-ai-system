export interface BusinessLesson {
  id: string;
  title: string;
  category: string;
  lesson: string;
  impact: string;
  confidence: number;
  evidenceIds: string[];
  recordedAt: number;
}

export interface EnterpriseMemorySnapshot {
  totalLessons: number;
  categories: string[];
  highestImpact: BusinessLesson[];
  recentLearnings: BusinessLesson[];
  generatedAt: number;
}

export function synthesizeEnterpriseMemory(params: {
  decisionCount: number;
  lessonCount: number;
  timestampMs: number;
}): EnterpriseMemorySnapshot {
  return {
    totalLessons: params.lessonCount,
    categories: ['revenue', 'delivery', 'governance', 'operations', 'strategy'],
    highestImpact: [],
    recentLearnings: [],
    generatedAt: Date.now(),
  };
}
