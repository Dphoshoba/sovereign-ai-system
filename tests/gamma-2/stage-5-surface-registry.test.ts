import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { buildGammaStage5ApiManifest } from "../../src/lib/gamma-2/stage-5-api-manifest";
import { buildGammaStage5DeploymentSummary } from "../../src/lib/gamma-2/stage-5-deployment-summary";
import { buildGammaStage5OpenApiDocument } from "../../src/lib/gamma-2/stage-5-openapi";
import { buildGammaStage5ReleaseDashboard } from "../../src/lib/gamma-2/stage-5-release-dashboard";
import { buildGammaStage5ReleaseEvidenceContext } from "../../src/lib/gamma-2/stage-5-release-evidence-context";
import { buildGammaStage5SdkDescriptor } from "../../src/lib/gamma-2/stage-5-sdk";
import {
  GAMMA_STAGE_5_SMOKE_SUMMARY,
  GAMMA_STAGE_5_SURFACE_COUNTS,
  getGammaStage5DashboardSurfaces,
  getGammaStage5EndpointPaths,
  getGammaStage5ManifestSurfaces,
  getGammaStage5OpenApiSurfaces,
  getGammaStage5SdkSurfaces,
  getGammaStage5SmokeRoutes,
  getGammaStage5Surfaces,
} from "../../src/lib/gamma-2/stage-5-surface-registry";

function readFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);

    return stat.isDirectory() ? readFiles(path) : [path];
  });
}

describe("Gamma 2 Stage 5 surface registry", () => {
  it("derives canonical Stage 5 counts from ordered surfaces", () => {
    const surfaces = getGammaStage5Surfaces();

    expect(surfaces).toHaveLength(GAMMA_STAGE_5_SURFACE_COUNTS.totalEndpoints);
    expect(getGammaStage5EndpointPaths()).toHaveLength(
      GAMMA_STAGE_5_SURFACE_COUNTS.totalEndpoints
    );
    expect(getGammaStage5ManifestSurfaces()).toHaveLength(
      GAMMA_STAGE_5_SURFACE_COUNTS.manifestCount
    );
    expect(getGammaStage5SdkSurfaces()).toHaveLength(GAMMA_STAGE_5_SURFACE_COUNTS.sdkCount);
    expect(getGammaStage5OpenApiSurfaces()).toHaveLength(
      GAMMA_STAGE_5_SURFACE_COUNTS.openapiCount
    );
    expect(getGammaStage5DashboardSurfaces()).toHaveLength(
      GAMMA_STAGE_5_SURFACE_COUNTS.dashboardCount
    );
    expect(GAMMA_STAGE_5_SMOKE_SUMMARY).toBe(
      `${GAMMA_STAGE_5_SURFACE_COUNTS.totalSmokeCoveredRoutes} routes passed, 0 failed`
    );
  });

  it("keeps release surfaces aligned with the registry", () => {
    const manifest = buildGammaStage5ApiManifest();
    const sdk = buildGammaStage5SdkDescriptor();
    const openapi = buildGammaStage5OpenApiDocument();
    const dashboard = buildGammaStage5ReleaseDashboard();
    const deploymentSummary = buildGammaStage5DeploymentSummary();

    expect(manifest.endpointCount).toBe(GAMMA_STAGE_5_SURFACE_COUNTS.manifestCount);
    expect(sdk.endpointCount).toBe(GAMMA_STAGE_5_SURFACE_COUNTS.sdkCount);
    expect(Object.keys(openapi.paths)).toHaveLength(GAMMA_STAGE_5_SURFACE_COUNTS.openapiCount);
    expect(dashboard.apiSurface).toHaveLength(GAMMA_STAGE_5_SURFACE_COUNTS.dashboardCount);
    expect(deploymentSummary.apiSurface).toEqual(getGammaStage5EndpointPaths());
    expect(getGammaStage5SmokeRoutes()).toHaveLength(
      GAMMA_STAGE_5_SURFACE_COUNTS.totalSmokeCoveredRoutes
    );
  });

  it("keeps the shared release evidence context deterministic", () => {
    expect(buildGammaStage5ReleaseEvidenceContext()).toEqual(
      buildGammaStage5ReleaseEvidenceContext()
    );
  }, 240000);

  it("does not leave stale hard-coded Stage 5 route counts in code or tests", () => {
    const files = [
      ...readFiles(join(process.cwd(), "src", "lib", "gamma-2")),
      ...readFiles(join(process.cwd(), "tests", "gamma-2")),
      join(process.cwd(), "scripts", "smoke-test-sovereign-v1.ts"),
    ].filter((file) => /\.(ts|tsx)$/.test(file));
    const stalePatterns = [
      /toBe\(45\)/,
      /toHaveLength\(45\)/,
      /apiSurfaceCount\)\.toBe\(45\)/,
      /endpointCount\)\.toBe\(45\)/,
      /68 routes passed, 0 failed/,
    ];
    const offenders = files.filter((file) => {
      if (
        file.endsWith("stage-5-surface-registry.ts") ||
        file.endsWith("stage-5-surface-registry.test.ts")
      ) {
        return false;
      }

      const text = readFileSync(file, "utf8");
      return stalePatterns.some((pattern) => pattern.test(text));
    });

    expect(offenders).toEqual([]);
  });
});
