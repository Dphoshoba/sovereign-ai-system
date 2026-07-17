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
    let maxConfidence = 0;

    for (const candidate of candidates) {
      if (resource.id === candidate.id) continue;

      let currentConfidence = 0;
      if (resource.checksum && candidate.checksum && resource.checksum === candidate.checksum) {
        currentConfidence += 0.8;
      }
      if (resource.size !== null && candidate.size !== null && resource.size === candidate.size) {
        currentConfidence += 0.1;
      }
      if (resource.name && candidate.name && resource.name === candidate.name) {
        currentConfidence += 0.1;
      }
      if (resource.mimeType && candidate.mimeType && resource.mimeType === candidate.mimeType) {
        currentConfidence += 0.05;
      }

      if (currentConfidence > 0) {
        maxConfidence = Math.max(maxConfidence, currentConfidence);
        matches.push(candidate.id);
      }
    }

    return {
      confidence: Math.min(maxConfidence, 1.0),
      comparisonBasis: ['checksum', 'size', 'name', 'mimeType'],
      duplicateGroupId: maxConfidence >= 0.8 ? `dup-group-${resource.id}` : null,
      ambiguityWarnings: maxConfidence > 0 && maxConfidence < 0.5 ? ["Low confidence duplicate detected"] : [],
    };
  }
}
