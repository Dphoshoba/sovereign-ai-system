import type { PhaseXVConnectorId } from "./production-connectors";

export type MissionWorkstream =
  | "research"
  | "content"
  | "graphics"
  | "video"
  | "landing-page"
  | "newsletter"
  | "social"
  | "analytics"
  | "support"
  | "archive";

export interface MissionAutomationRequest {
  missionId: string;
  title: string;
  objective: string;
  currentTime: Date;
}

export interface MissionWorkPackage {
  id: string;
  workstream: MissionWorkstream;
  title: string;
  connectorHints: PhaseXVConnectorId[];
  status: "planned";
  approvalRequired: true;
  previewOnly: true;
  auditRoute: string;
}

export interface MissionAutomationPlan {
  id: string;
  missionId: string;
  owner: "gamma";
  title: string;
  state: "preview-plan-ready";
  executionBoundary: "preview-only";
  generatedAt: Date;
  workPackages: MissionWorkPackage[];
  governanceCheckpoints: string[];
  warnings: string[];
}

const LAUNCH_COURSE_WORKSTREAMS: Array<{
  workstream: MissionWorkstream;
  title: string;
  connectorHints: PhaseXVConnectorId[];
}> = [
  {
    workstream: "research",
    title: "Research audience, offer, and launch risks",
    connectorHints: ["notion", "drive", "sharepoint"],
  },
  {
    workstream: "content",
    title: "Draft course narrative and lesson outline",
    connectorHints: ["gmail", "notion", "drive"],
  },
  {
    workstream: "graphics",
    title: "Prepare governed creative brief",
    connectorHints: ["drive", "dropbox", "onedrive"],
  },
  {
    workstream: "video",
    title: "Prepare launch video production plan",
    connectorHints: ["drive", "dropbox", "onedrive"],
  },
  {
    workstream: "landing-page",
    title: "Prepare landing page copy and asset plan",
    connectorHints: ["github", "drive", "notion"],
  },
  {
    workstream: "newsletter",
    title: "Prepare newsletter sequence preview",
    connectorHints: ["gmail", "microsoft-365", "hubspot"],
  },
  {
    workstream: "social",
    title: "Prepare social announcement previews",
    connectorHints: ["slack", "discord", "drive"],
  },
  {
    workstream: "analytics",
    title: "Prepare measurement dashboard plan",
    connectorHints: ["github", "stripe", "hubspot"],
  },
  {
    workstream: "support",
    title: "Prepare support and response workflow",
    connectorHints: ["gmail", "slack", "salesforce"],
  },
  {
    workstream: "archive",
    title: "Prepare launch archive and evidence trail",
    connectorHints: ["drive", "sharepoint", "onedrive"],
  },
];

function slug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildWorkPackages(request: MissionAutomationRequest): MissionWorkPackage[] {
  const missionSlug = slug(request.missionId || request.title);

  return LAUNCH_COURSE_WORKSTREAMS.map((item, index) => ({
    id: `pkg_${missionSlug}_${String(index + 1).padStart(2, "0")}_${item.workstream}`,
    workstream: item.workstream,
    title: item.title,
    connectorHints: [...item.connectorHints],
    status: "planned",
    approvalRequired: true,
    previewOnly: true,
    auditRoute: `audit://gamma/mission-automation/${request.missionId}/${item.workstream}`,
  }));
}

export function buildMissionAutomationPlan(
  request: MissionAutomationRequest
): MissionAutomationPlan {
  const workPackages = buildWorkPackages(request);

  return {
    id: `mission_plan_${slug(request.missionId)}`,
    missionId: request.missionId,
    owner: "gamma",
    title: request.title,
    state: "preview-plan-ready",
    executionBoundary: "preview-only",
    generatedAt: new Date(request.currentTime),
    workPackages,
    governanceCheckpoints: [
      "human-approval-required",
      "connector-writes-preview-only",
      "audit-route-required",
      "queue-before-execution",
    ],
    warnings: [
      "Mission automation decomposes work only; it does not execute connector writes.",
    ],
  };
}

export function buildPhaseXVIIReadiness(): {
  phase: "XVII";
  name: "Mission Automation";
  requiredWorkstreamCount: number;
  missionRule: "one-request-governed-work-packages";
} {
  return {
    phase: "XVII",
    name: "Mission Automation",
    requiredWorkstreamCount: LAUNCH_COURSE_WORKSTREAMS.length,
    missionRule: "one-request-governed-work-packages",
  };
}
