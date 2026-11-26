import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { buildGammaStage5ApiManifest } from "../../src/lib/gamma-2/stage-5-api-manifest";
import { buildGammaStage5DeploymentSummary } from "../../src/lib/gamma-2/stage-5-deployment-summary";
import { buildGammaStage5OpenApiDocument } from "../../src/lib/gamma-2/stage-5-openapi";
import { buildGammaStage5ReleaseDashboard } from "../../src/lib/gamma-2/stage-5-release-dashboard";
import { buildGammaStage5ReleaseProjectionContext } from "../../src/lib/gamma-2/stage-5-release-projection-context";
import { getGammaStage5ReleaseProjectionRegistry } from "../../src/lib/gamma-2/stage-5-release-projection-registry";
import { buildGammaStage5SdkDescriptor } from "../../src/lib/gamma-2/stage-5-sdk";
import {
  buildGammaStage5SharedReleaseGraph,
  GAMMA_STAGE_5_SHARED_RELEASE_GRAPH_PROJECTION_COUNT,
} from "../../src/lib/gamma-2/stage-5-shared-release-graph";
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

    expect(Object.isFrozen(graph.projections)).toBe(true);
    expect(graph.sourceArtifactCount).toBe(GAMMA_STAGE_5_SHARED_RELEASE_GRAPH_PROJECTION_COUNT);
    expect(graph.projectionCount).toBe(GAMMA_STAGE_5_SHARED_RELEASE_GRAPH_PROJECTION_COUNT);
    expect(graph.generatedAt.toISOString()).toBe("2026-07-12T00:00:00.000Z");
    expect(buildGammaStage5SharedReleaseGraph().generatedAt).toEqual(graph.generatedAt);
  });

  it("keeps release projection registry ordering and graph access deterministic", () => {
    const registry = getGammaStage5ReleaseProjectionRegistry();
    const context = buildGammaStage5ReleaseProjectionContext();

    expect(registry.map((entry) => entry.id)).toEqual([
      "operator-handoff",
      "operator-signoff",
      "rollback-plan",
      "release-approval-packet",
      "release-promotion-plan",
      "release-cutover-checklist",
      "release-traffic-shift-plan",
      "release-monitoring-plan",
      "release-post-promotion-review",
      "release-operations-index",
      "release-closeout-packet",
      "release-closure-ledger",
      "release-completion-certificate",
      "release-finalization-index",
      "release-operator-registry",
      "release-operator-action-queue",
      "release-operator-approval-packet",
      "release-operator-approval-audit-trail",
      "release-operator-approval-receipt",
      "release-production-authorization-ledger",
      "release-production-cutover-packet",
    ]);
    expect(registry.map((entry) => entry.order)).toEqual(
      Array.from({ length: registry.length }, (_, index) => index + 1)
    );
    expect(Object.isFrozen(context)).toBe(true);
    expect(context.metrics.graphConstructionCount).toBe(1);
    expect(context.metrics.projectionInvocationCount).toBe(0);
    expect(context.metrics.lateBuilderInvocationCount).toBe(0);
    expect(context.metrics.duplicateGraphCompositionCount).toBe(0);
    expect(context.graph.sourceArtifactCount).toBe(GAMMA_STAGE_5_SHARED_RELEASE_GRAPH_PROJECTION_COUNT);
    expect(context.graph.projectionCount).toBe(GAMMA_STAGE_5_SHARED_RELEASE_GRAPH_PROJECTION_COUNT);
  });

  it("keeps migrated public builders as projection wrappers", () => {
    const migratedBuilders = [
      {
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-operator-handoff.ts"),
        name: "buildGammaStage5OperatorHandoff",
      },
      {
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-operator-signoff.ts"),
        name: "buildGammaStage5OperatorSignoff",
      },
      {
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-rollback-plan.ts"),
        name: "buildGammaStage5RollbackPlan",
      },
      {
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-release-approval-packet.ts"),
        name: "buildGammaStage5ReleaseApprovalPacket",
      },
      {
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-release-promotion-plan.ts"),
        name: "buildGammaStage5ReleasePromotionPlan",
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
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-release-post-promotion-review.ts"),
        name: "buildGammaStage5ReleasePostPromotionReview",
      },
      {
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-release-operations-index.ts"),
        name: "buildGammaStage5ReleaseOperationsIndex",
      },
      {
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-release-closeout-packet.ts"),
        name: "buildGammaStage5ReleaseCloseoutPacket",
      },
      {
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-release-closure-ledger.ts"),
        name: "buildGammaStage5ReleaseClosureLedger",
      },
      {
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-release-completion-certificate.ts"),
        name: "buildGammaStage5ReleaseCompletionCertificate",
      },
      {
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-release-finalization-index.ts"),
        name: "buildGammaStage5ReleaseFinalizationIndex",
      },
      {
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-release-operator-registry.ts"),
        name: "buildGammaStage5ReleaseOperatorRegistry",
      },
      {
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-release-operator-action-queue.ts"),
        name: "buildGammaStage5ReleaseOperatorActionQueue",
      },
      {
        file: join(process.cwd(), "src", "lib", "gamma-2", "stage-5-release-operator-approval-packet.ts"),
        name: "buildGammaStage5ReleaseOperatorApprovalPacket",
      },
      {
        file: join(
          process.cwd(),
          "src",
          "lib",
          "gamma-2",
          "stage-5-release-operator-approval-audit-trail.ts"
        ),
        name: "buildGammaStage5ReleaseOperatorApprovalAuditTrail",
      },
      {
        file: join(
          process.cwd(),
          "src",
          "lib",
          "gamma-2",
          "stage-5-release-operator-approval-receipt.ts"
        ),
        name: "buildGammaStage5ReleaseOperatorApprovalReceipt",
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
