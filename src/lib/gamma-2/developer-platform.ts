export type GammaSdkName =
  | "connector-sdk"
  | "workflow-sdk"
  | "policy-sdk"
  | "agent-sdk"
  | "mission-sdk"
  | "ui-sdk";

export interface GammaSdkPackage {
  name: GammaSdkName;
  version: string;
  docsUrl: string;
  sandboxEnabled: boolean;
  governanceReviewed: boolean;
}

export interface DeveloperPlatformInput {
  releaseId: string;
  currentTime: Date;
  packages: GammaSdkPackage[];
}

export interface DeveloperPlatformRelease {
  id: string;
  releaseId: string;
  status: "developer-platform-ready" | "blocked";
  packages: GammaSdkPackage[];
  missingSdks: GammaSdkName[];
  blockedPackages: Array<{
    name: GammaSdkName;
    reason: string;
  }>;
  releaseChecklist: string[];
  generatedAt: Date;
}

export const PHASE_XXIV_REQUIRED_SDKS: GammaSdkName[] = [
  "connector-sdk",
  "workflow-sdk",
  "policy-sdk",
  "agent-sdk",
  "mission-sdk",
  "ui-sdk",
];

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

function normalizePackages(packages: GammaSdkPackage[]): GammaSdkPackage[] {
  return PHASE_XXIV_REQUIRED_SDKS.flatMap((name) => {
    const matched = packages
      .filter((pkg) => pkg.name === name)
      .sort((a, b) => a.version.localeCompare(b.version));
    return matched.slice(-1);
  });
}

function packageBlockers(pkg: GammaSdkPackage): string[] {
  const blockers: string[] = [];
  if (!SEMVER_PATTERN.test(pkg.version)) blockers.push("version must be semantic");
  if (pkg.docsUrl.trim().length === 0) blockers.push("docs url required");
  if (!pkg.sandboxEnabled) blockers.push("sandbox required");
  if (!pkg.governanceReviewed) blockers.push("governance review required");
  return blockers;
}

export function buildDeveloperPlatformRelease(
  input: DeveloperPlatformInput
): DeveloperPlatformRelease {
  const packages = normalizePackages(input.packages);
  const missingSdks = PHASE_XXIV_REQUIRED_SDKS.filter(
    (sdk) => !packages.some((pkg) => pkg.name === sdk)
  );
  const blockedPackages = packages.flatMap((pkg) =>
    packageBlockers(pkg).map((reason) => ({
      name: pkg.name,
      reason,
    }))
  );

  return {
    id: `developer_platform_${input.releaseId}`,
    releaseId: input.releaseId,
    status:
      missingSdks.length === 0 && blockedPackages.length === 0
        ? "developer-platform-ready"
        : "blocked",
    packages,
    missingSdks,
    blockedPackages,
    releaseChecklist: [
      "sdk-catalog-complete",
      "semver-required",
      "documentation-required",
      "sandbox-required",
      "governance-review-required",
    ],
    generatedAt: new Date(input.currentTime),
  };
}

export function buildPhaseXXIVReadiness(): {
  phase: "XXIV";
  name: "Developer Platform";
  requiredSdks: GammaSdkName[];
  developerRule: "third-party-builds-through-governed-sdks";
} {
  return {
    phase: "XXIV",
    name: "Developer Platform",
    requiredSdks: [...PHASE_XXIV_REQUIRED_SDKS],
    developerRule: "third-party-builds-through-governed-sdks",
  };
}
