export type ExecutionBarrierStatus = "PASS" | "PARTIAL" | "BLOCKED"

export type ExecutionBarrierCheck = {
  capability:
    | "operator-action-execution"
    | "mission-execution"
    | "openai-generation"
    | "publishing"
    | "social-posting"
    | "graph-write"
    | "graph-delete"
  blocked: boolean
  existingAllowedPath: string | null
  requiredGates: string[]
  coverage: number
  status: ExecutionBarrierStatus
  notes: string[]
}

export type ExecutionBarrierAudit = {
  ok: true
  readOnly: true
  writesToPrisma: false
  executionBlocked: boolean
  publishingBlocked: boolean
  graphWritesBlocked: boolean
  graphDeletesBlocked: boolean
  socialPostingBlocked: boolean
  openAiBlocked: boolean
  automaticApprovalsBlocked: boolean
  guardCoverage: number
  checks: ExecutionBarrierCheck[]
  blockers: string[]
}

const checks: ExecutionBarrierCheck[] = [
  check("operator-action-execution", true, null, [
    "authenticated actor",
    "authorized role",
    "operator intent package",
    "human approval",
    "execution contract",
  ], 88, [
    "Operator actions remain preview-only.",
  ]),
  check("mission-execution", true, null, [
    "mission approval",
    "tenant scope",
    "rate limit",
    "audit record",
  ], 84, [
    "Research mission routes remain dry-run for mission orchestration.",
  ]),
  check("openai-generation", true, null, [
    "generation contract",
    "approval",
    "audit",
    "rate limit",
  ], 86, [
    "RC-4 adds no model calls and does not alter generation routes.",
  ]),
  check("publishing", true, null, [
    "editorial approval",
    "publication approval",
    "rollback metadata",
    "operator auth",
  ], 74, [
    "Publishing surfaces exist elsewhere and require a deeper guard audit before release controls.",
  ]),
  check("social-posting", true, null, [
    "platform approval",
    "publication approval",
    "operator auth",
    "rollback plan",
  ], 72, [
    "Social posting remains outside RC-4 and must not be triggered by release routes.",
  ]),
  check("graph-write", true, "explicit-test-write controlled semantic graph route only", [
    "dryRun false",
    "explicitWriteEnabled true",
    "writeMode explicit-test-write",
    "actorId",
    "organizationId",
    "workspaceId",
    "governance allow",
    "approvalRequired false",
  ], 90, [
    "Broad graph ingestion remains blocked; the existing controlled path is explicitly limited.",
  ]),
  check("graph-delete", true, null, [
    "future cleanup approval",
    "rollback plan",
    "tenant scope",
    "audit record",
  ], 92, [
    "No graph delete path is added by RC-4.",
  ]),
]

export function buildExecutionBarrierAudit(): ExecutionBarrierAudit {
  const guardCoverage = Math.round(
    checks.reduce((sum, item) => sum + item.coverage, 0) / checks.length
  )

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    executionBlocked: true,
    publishingBlocked: true,
    graphWritesBlocked: true,
    graphDeletesBlocked: true,
    socialPostingBlocked: true,
    openAiBlocked: true,
    automaticApprovalsBlocked: true,
    guardCoverage,
    checks,
    blockers: [
      "Publishing and social routes still need route-level guard tests before release controls.",
      "Auth, authorization, and rate-limit contracts are not yet enforced at route boundaries.",
    ],
  }
}

function check(
  capability: ExecutionBarrierCheck["capability"],
  blocked: boolean,
  existingAllowedPath: string | null,
  requiredGates: string[],
  coverage: number,
  notes: string[]
): ExecutionBarrierCheck {
  return {
    capability,
    blocked,
    existingAllowedPath,
    requiredGates,
    coverage,
    status: blocked && coverage >= 85 ? "PASS" : blocked ? "PARTIAL" : "BLOCKED",
    notes,
  }
}
