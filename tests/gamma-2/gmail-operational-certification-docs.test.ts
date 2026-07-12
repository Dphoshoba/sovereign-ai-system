import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readDoc(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Phase XV Gmail operational certification documentation", () => {
  it("keeps the roadmap truth audit honest about Gmail live capability", () => {
    const audit = readDoc("docs/platform/GAMMA_2_ROADMAP_TRUTH_AUDIT.md");

    expect(audit).toContain("| Gmail | `IMPLEMENTED_SIMULATION_ONLY` |");
    expect(audit).toContain("Live send still requires explicit operator approval and supplied credentials.");
  });

  it("prevents the master plan from claiming Gmail live production certification prematurely", () => {
    const masterPlan = readDoc("docs/platform/PHASE_XV_PRODUCTION_CONNECTORS_MASTER_PLAN.md");

    expect(masterPlan).toContain("Simulation-certified reference connector");
    expect(masterPlan).toContain("Operational production certification pending");
    expect(masterPlan).not.toContain("| Gmail | Certified reference connector | Certified v1.0");
  });

  it("documents the Gmail remediation packet and live-action boundary", () => {
    const remediation = readDoc("docs/phase-xv/GMAIL_OPERATIONAL_CERTIFICATION_REMEDIATION.md");
    const runbook = readDoc("docs/phase-xv/GMAIL_OPERATOR_RUNBOOK.md");
    const specification = readDoc("docs/phase-xv/GMAIL_CONNECTOR_V1.md");
    const certification = readDoc("docs/phase-xv/GMAIL_SIMULATION_SAFE_EXECUTION_CERTIFICATION.md");

    expect(remediation).toContain("Gmail is not yet certified for live production sends.");
    expect(remediation).toContain("This remediation does not authorize live email sends.");
    expect(runbook).toContain("No real email may be sent unless the operator explicitly approves that exact action");
    expect(specification).toContain("SIMULATION-CERTIFIED");
    expect(specification).not.toContain("Recommendation**: Safe to deploy");
    expect(certification).toContain("Gmail is certified for simulation-safe execution.");
    expect(certification).toContain("Gmail is not certified for live production execution.");
  });
});
