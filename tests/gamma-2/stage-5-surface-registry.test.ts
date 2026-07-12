import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { buildGammaStage5ApiManifest } from "../../src/lib/gamma-2/stage-5-api-manifest";
import { buildGammaStage5DeploymentSummary } from "../../src/lib/gamma-2/stage-5-deployment-summary";
import { buildGammaStage5OpenApiDocument } from "../../src/lib/gamma-2/stage-5-openapi";
import { buildGammaStage5ReleaseDashboard } from "../../src/lib/gamma-2/stage-5-release-dashboard";
import { buildGammaStage5ReleaseEvidenceContext } from "../../src/lib/gamma-2/stage-5-release-evidence-context";
import { buildGammaStage5ReleaseProjectionContext } from "../../src/lib/gamma-2/stage-5-release-projection-context";
import {
  getGammaStage5ReleaseProjectionRegistry,
  projectGammaStage5ReleaseProductionCutoverPacket,
} from "../../src/lib/gamma-2/stage-5-release-projection-registry";
import { buildGammaStage5SdkDescriptor } from "../../src/lib/gamma-2/stage-5-sdk";
import { buildGammaStage5SharedReleaseGraph } from "../../src/lib/gamma-2/stage-5-shared-release-graph";
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
    const graph = buildGammaStage5SharedReleaseGraph();
    const context = buildGammaStage5ReleaseEvidenceContext();

    expect(graph).toEqual(buildGammaStage5SharedReleaseGraph());
    expect(Object.isFrozen(graph.projections)).toBe(true);
    expect(graph.sourceArtifactCount).toBe(5);
    expect(graph.projectionCount).toBe(5);
    expect(context.sourceBuilderCount).toBe(1);
    expect(context.graphProjectionCount).toBe(graph.projectionCount);
    expect(context.authorizationLedger).toEqual(graph.projections.authorizationLedger);
    expect(context.cutoverChecklist).toEqual(graph.projections.cutoverChecklist);
    expect(context.trafficShiftPlan).toEqual(graph.projections.trafficShiftPlan);
    expect(context.rollbackPlan).toEqual(graph.projections.rollbackPlan);
    expect(context.monitoringPlan).toEqual(graph.projections.monitoringPlan);
    expect(context).toEqual(buildGammaStage5ReleaseEvidenceContext());
  }, 240000);

  it("keeps release projection registry ordering and graph access deterministic", () => {
    const registry = getGammaStage5ReleaseProjectionRegistry();
    const context = buildGammaStage5ReleaseProjectionContext();
    const before = structuredClone(context.graph.projections.authorizationLedger);
    const projection = projectGammaStage5ReleaseProductionCutoverPacket(context);

    expect(registry.map((entry) => entry.id)).toEqual([
      "rollback-plan",
      "release-cutover-checklist",
      "release-traffic-shift-plan",
      "release-monitoring-plan",
      "release-production-authorization-ledger",
      "release-production-cutover-packet",
    ]);
    expect(registry.map((entry) => entry.order)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(Object.isFrozen(context)).toBe(true);
    expect(context.graph.sourceArtifactCount).toBe(5);
    expect(context.graph.projectionCount).toBe(5);
    expect(projection.authorizationEntryCount).toBe(
      context.graph.projections.authorizationLedger.authorizationEntryCount
    );
    expect(context.graph.projections.authorizationLedger).toEqual(before);
    expect(projectGammaStage5ReleaseProductionCutoverPacket(context)).toEqual(projection);
  }, 240000);

  it("keeps migrated public builders as projection wrappers", () => {
    const migratedBuilders = [
      {
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-rollback-plan.ts"),
        name: "buildGammaStage5RollbackPlan",
      },
      {
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-release-cutover-checklist.ts"),
        name: "buildGammaStage5ReleaseCutoverChecklist",
      },
      {
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-release-traffic-shift-plan.ts"),
        name: "buildGammaStage5ReleaseTrafficShiftPlan",
      },
      {
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-release-monitoring-plan.ts"),
        name: "buildGammaStage5ReleaseMonitoringPlan",
      },
      {
        file: join(
          process.cwd(),
          "src",
          "lib",
          "gamma-2",
          "stage-5-release-production-authorization-ledger.ts"
        ),
        name: "buildGammaStage5ReleaseProductionAuthorizationLedger",
      },
      {
        file: join(
          process.cwd(),
          "src",
          "lib",
          "gamma-2",
          "stage-5-release-production-cutover-packet.ts"
        ),
        name: "buildGammaStage5ReleaseProductionCutoverPacket",
      },
    ];

    const offenders = migratedBuilders.filter(({ file, name }) => {
      const text = readFileSync(file, "utf8");
      const start = text.indexOf(`export function ${name}(`);
      const nextExport = text.indexOf("\nexport function ", start + 1);
      const body = start >= 0 ? text.slice(start, nextExport === -1 ? undefined : nextExport) : "";

      return !body.includes("buildGammaStage5ReleaseProjectionContext()");
    });

    expect(offenders).toEqual([]);
  });

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
