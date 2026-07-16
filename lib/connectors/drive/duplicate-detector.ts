import type { DriveResource } from "./resource-parser";

export interface DuplicateAnalysis {
  confidence: number; // 0.0 to 1.0
  comparisonBasis: string[];
  duplicateGroupId: string | null;
  ambiguityWarnings: string[];
}

export class DriveDuplicateDetector {
  static analyze(resource: DriveResource, candidates: DriveResource[]): DuplicateAnalysis {
    if (candidates.length === 0) {
      return { confidence: 0, comparisonBasis: [], duplicateGroupId: null, ambiguityWarnings: [] };
    }

    const matches: string[] = [];
    let confidence = 0;

    for (const candidate of candidates) {
      if (resource.id === candidate.id) continue;

      let matchCount = 0;
      if (resource.checksum && resource.checksum === candidate.checksum) matchCount += 0.8;
      if (resource.size === candidate.size && resource.size !== null) matchCount += 0.1;
      if (resource.name === candidate.name) matchCount += 0.1;
      if (resource.mimeType === candidate.mimeType) matchCount += 0.05;

      if (matchCount > 0) {
        confidence = Math.max(confidence, matchCount);
        matches.push(candidate.id);
      }
    }

    return {
      confidence: Math.min(confidence, 1.0),
      comparisonBasis: ['checksum', 'size', 'name', 'mimeType'],
      duplicateGroupId: confidence > 0.8 ? `dup-group-${resource.id}` : null,
      ambiguityWarnings: confidence > 0 && confidence < 0.5 ? ["Low confidence duplicate detected"] : [],
    };
  }
}
