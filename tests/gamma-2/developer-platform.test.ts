import { describe, expect, it } from "vitest";
import {
  PHASE_XXIV_REQUIRED_SDKS,
  buildDeveloperPlatformRelease,
  buildPhaseXXIVReadiness,
  type GammaSdkName,
  type GammaSdkPackage,
} from "../../src/lib/gamma-2/developer-platform";

const BASE_TIME = new Date("2026-07-12T00:00:00.000Z");

function sdk(name: GammaSdkName, overrides: Partial<GammaSdkPackage> = {}): GammaSdkPackage {
  return {
    name,
    version: "1.0.0",
    docsUrl: `docs://gamma/${name}`,
    sandboxEnabled: true,
    governanceReviewed: true,
    ...overrides,
  };
}

describe("Gamma 2 Phase XXIV Developer Platform", () => {
  it("marks the platform ready when all governed SDKs are releasable", () => {
    const release = buildDeveloperPlatformRelease({
      releaseId: "sdk-v1",
      currentTime: BASE_TIME,
      packages: PHASE_XXIV_REQUIRED_SDKS.map((name) => sdk(name)),
    });

    expect(release.status).toBe("developer-platform-ready");
    expect(release.missingSdks).toEqual([]);
    expect(release.blockedPackages).toEqual([]);
    expect(release.packages.map((pkg) => pkg.name)).toEqual(PHASE_XXIV_REQUIRED_SDKS);
  });

  it("blocks missing SDKs", () => {
    const release = buildDeveloperPlatformRelease({
      releaseId: "missing-ui",
      currentTime: BASE_TIME,
      packages: PHASE_XXIV_REQUIRED_SDKS.filter((name) => name !== "ui-sdk").map((name) =>
        sdk(name)
      ),
    });

    expect(release.status).toBe("blocked");
    expect(release.missingSdks).toEqual(["ui-sdk"]);
  });

  it("blocks SDKs without docs, sandbox, semver, or governance review", () => {
    const release = buildDeveloperPlatformRelease({
      releaseId: "blocked-sdk",
      currentTime: BASE_TIME,
      packages: [
        sdk("connector-sdk", {
          version: "latest",
          docsUrl: "",
          sandboxEnabled: false,
          governanceReviewed: false,
        }),
        ...PHASE_XXIV_REQUIRED_SDKS.filter((name) => name !== "connector-sdk").map((name) =>
          sdk(name)
        ),
      ],
    });

    expect(release.status).toBe("blocked");
    expect(release.blockedPackages).toEqual([
      { name: "connector-sdk", reason: "version must be semantic" },
      { name: "connector-sdk", reason: "docs url required" },
      { name: "connector-sdk", reason: "sandbox required" },
      { name: "connector-sdk", reason: "governance review required" },
    ]);
  });

  it("is deterministic for identical SDK catalog input", () => {
    const input = {
      releaseId: "deterministic",
      currentTime: BASE_TIME,
      packages: PHASE_XXIV_REQUIRED_SDKS.map((name) => sdk(name)),
    };

    expect(buildDeveloperPlatformRelease(input)).toEqual(buildDeveloperPlatformRelease(input));
  });

  it("reports Phase XXIV readiness", () => {
    const readiness = buildPhaseXXIVReadiness();

    expect(readiness.phase).toBe("XXIV");
    expect(readiness.requiredSdks).toEqual(PHASE_XXIV_REQUIRED_SDKS);
    expect(readiness.developerRule).toBe("third-party-builds-through-governed-sdks");
  });
});
