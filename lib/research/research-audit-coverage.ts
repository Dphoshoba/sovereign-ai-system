export type ResearchAuditCoverageInput = {
  listedSourceCount: number;
  availableSourceCount: number;
  acceptedSourceCount: number;
  factualClaimCount: number;
  mappedClaimCount: number;
};

export type ResearchAuditCoverage = {
  listedSourceAvailability: number;
  sourceCoverage: number;
  acceptedEvidenceCoverage: number;
};

function percent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round(Math.min(1, Math.max(0, numerator / denominator)) * 100);
}

export function researchAuditCoverage(
  input: ResearchAuditCoverageInput,
): ResearchAuditCoverage {
  return {
    listedSourceAvailability: percent(
      input.availableSourceCount,
      input.listedSourceCount,
    ),
    sourceCoverage: percent(input.acceptedSourceCount, input.listedSourceCount),
    acceptedEvidenceCoverage: percent(
      input.mappedClaimCount,
      input.factualClaimCount,
    ),
  };
}
