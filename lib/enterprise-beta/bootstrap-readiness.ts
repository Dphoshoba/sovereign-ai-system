import { buildSessionBootstrapCheckpoints } from "./session-bootstrap"
import { buildTenantBootstrapRequirements } from "./tenant-bootstrap"

export function evaluateBootstrapCoverage() {
  const sessionBootstrap = buildSessionBootstrapCheckpoints()
  const tenantBootstrap = buildTenantBootstrapRequirements()

  const sessionRequired = sessionBootstrap.filter((checkpoint) => checkpoint.required).length
  const tenantRequired = tenantBootstrap.filter((requirement) => requirement.required).length

  return {
    score: Math.round(
      (sessionRequired / sessionBootstrap.length) * 55 +
        (tenantRequired / tenantBootstrap.length) * 35
    ),
    status: "BOOTSTRAP_DEFINED_REPORT_ONLY" as const,
    sessionsEnabled: false,
    sessionBootstrap,
    tenantBootstrap,
  }
}
