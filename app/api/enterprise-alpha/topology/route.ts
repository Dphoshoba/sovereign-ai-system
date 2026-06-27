import { NextResponse } from "next/server"

import {
  buildEnterpriseDepartments,
} from "../../../../lib/enterprise/department-model"
import {
  buildEnterpriseOrganizationHierarchy,
  evaluateOrganizationReadiness,
} from "../../../../lib/enterprise/organization-hierarchy"
import {
  buildEnterpriseMembershipContracts,
  evaluateMembershipReadiness,
} from "../../../../lib/enterprise/membership-contract"
import {
  buildEnterprisePolicies,
  evaluatePolicyReadiness,
} from "../../../../lib/enterprise/enterprise-policy-model"
import {
  buildEnterpriseRoles,
  evaluateRbacReadiness,
} from "../../../../lib/enterprise/enterprise-role-model"
import { buildEnterpriseTeams } from "../../../../lib/enterprise/team-model"
import {
  buildEnterpriseWorkspaces,
  evaluateWorkspaceReadiness,
} from "../../../../lib/enterprise/workspace-model"
import {
  buildWorkspaceIsolationRules,
  evaluateTenantIsolationReadiness,
} from "../../../../lib/enterprise/workspace-isolation"

export async function GET() {
  const organization = buildEnterpriseOrganizationHierarchy()
  const departments = buildEnterpriseDepartments()
  const teams = buildEnterpriseTeams()
  const workspaces = buildEnterpriseWorkspaces()
  const memberships = buildEnterpriseMembershipContracts()
  const roles = buildEnterpriseRoles()
  const policies = buildEnterprisePolicies()
  const isolationRules = buildWorkspaceIsolationRules(workspaces)

  const organizationReadiness = evaluateOrganizationReadiness(organization)
  const workspaceReadiness = evaluateWorkspaceReadiness(workspaces)
  const membershipReadiness = evaluateMembershipReadiness(memberships)
  const policyReadiness = evaluatePolicyReadiness(policies)
  const rbacReadiness = evaluateRbacReadiness(roles)
  const tenantIsolationReadiness =
    evaluateTenantIsolationReadiness(isolationRules)

  const enterpriseTopologyScore = Math.round(
    [
      organizationReadiness.score,
      workspaceReadiness.score,
      membershipReadiness.score,
      policyReadiness.score,
      rbacReadiness.score,
      tenantIsolationReadiness.score,
    ].reduce((sum, score) => sum + score, 0) / 6
  )

  return NextResponse.json({
    ok: true,
    readOnly: true,
    planningOnly: true,
    writesToPrisma: false,
    databaseWrites: false,
    schemaChanges: false,
    migrations: false,
    execution: false,
    publishing: false,
    graphWrites: false,
    graphDeletes: false,
    openAiCalls: false,
    authIntegration: false,
    sessions: false,
    jwt: false,
    enterpriseTopologyScore,
    workspaceScore: workspaceReadiness.score,
    rbacScore: rbacReadiness.score,
    membershipScore: membershipReadiness.score,
    tenantBoundaryScore: tenantIsolationReadiness.score,
    organizationReadiness,
    workspaceReadiness,
    membershipReadiness,
    policyReadiness,
    rbacReadiness,
    tenantIsolationReadiness,
    recommendedEA3:
      "EA-3 should audit tenant guard coverage and define report-only organization/workspace route guards without enabling execution.",
    topology: {
      organization,
      departments,
      teams,
      projects: organization.projects,
      workspaces,
      memberships,
      roles,
      policies,
      isolationRules,
    },
  })
}

