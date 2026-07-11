import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GitBranch,
  HeartPulse,
  LayoutDashboard,
  ListChecks,
  Network,
  PanelTop,
  ScrollText,
  RadioTower,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { buildGammaStage5ReadinessSnapshot } from "../../src/lib/gamma-2/stage-5-readiness";
import { buildGammaStage5EvidenceBundle } from "../../src/lib/gamma-2/stage-5-evidence";
import { buildGammaStage5ReleaseGate } from "../../src/lib/gamma-2/stage-5-release-gate";
import { buildGammaStage5PromotionChecklist } from "../../src/lib/gamma-2/stage-5-promotion-checklist";
import { buildGammaStage5DeploymentSummary } from "../../src/lib/gamma-2/stage-5-deployment-summary";
import { buildGammaStage5OperatorBrief } from "../../src/lib/gamma-2/stage-5-operator-brief";
import { buildGammaStage5Health } from "../../src/lib/gamma-2/stage-5-health";
import { buildGammaStage5ReleaseDashboard } from "../../src/lib/gamma-2/stage-5-release-dashboard";

export const metadata: Metadata = {
  title: "Gamma 2 Stage 5 Readiness",
  description: "Gamma 2 Stage 5 completion and readiness overview",
};

const statusTone = "border-emerald-500/40 bg-emerald-500/10 text-emerald-100";

export default function GammaStage5Page() {
  const snapshot = buildGammaStage5ReadinessSnapshot();
  const evidence = buildGammaStage5EvidenceBundle();
  const releaseGate = buildGammaStage5ReleaseGate();
  const promotionChecklist = buildGammaStage5PromotionChecklist();
  const deploymentSummary = buildGammaStage5DeploymentSummary();
  const operatorBrief = buildGammaStage5OperatorBrief();
  const health = buildGammaStage5Health();
  const releaseDashboard = buildGammaStage5ReleaseDashboard();
  const verification = [
    ["Tests", snapshot.verification.tests],
    ["Determinism", snapshot.verification.determinism],
    ["Build", snapshot.verification.build],
    ["Smoke", snapshot.verification.smoke],
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                <span className="inline-flex items-center gap-2 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-cyan-100">
                  <RadioTower className="h-4 w-4" aria-hidden="true" />
                  Stage 5
                </span>
                <span>{snapshot.branch}</span>
                <span>{snapshot.completionTag}</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-normal text-white md:text-4xl">
                Gamma 2 Readiness
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
                Phases XV through XXV are complete, verified, tagged, and exposed through the
                Stage 5 readiness contract.
              </p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 ${statusTone}`}>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-medium">{snapshot.status}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <section aria-labelledby="phase-status">
            <div className="mb-3 flex items-center gap-2">
              <Network className="h-5 w-5 text-cyan-300" aria-hidden="true" />
              <h2 id="phase-status" className="text-lg font-semibold text-white">
                Phase Status
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {snapshot.phases.map((phase) => (
                <article
                  key={phase.phase}
                  className="rounded-md border border-zinc-800 bg-zinc-900/80 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-medium uppercase text-zinc-500">
                        Phase {phase.phase}
                      </div>
                      <h3 className="mt-1 text-sm font-semibold text-white">{phase.name}</h3>
                    </div>
                    <span className={`rounded-md border px-2 py-1 text-xs ${statusTone}`}>
                      {phase.status}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-zinc-400">
                    <p>{phase.contract}</p>
                    <p>{phase.tests}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="evidence-bundle">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-emerald-300" aria-hidden="true" />
              <h2 id="evidence-bundle" className="text-lg font-semibold text-white">
                Evidence Bundle
              </h2>
            </div>
            <div className="rounded-md border border-zinc-800 bg-zinc-900/80">
              <div className="grid gap-3 border-b border-zinc-800 p-4 md:grid-cols-3">
                <div>
                  <div className="text-xs font-medium uppercase text-zinc-500">Status</div>
                  <div className="mt-1 text-sm text-emerald-100">{evidence.status}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-zinc-500">Tags</div>
                  <div className="mt-1 text-sm text-zinc-200">{evidence.tags.length}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-zinc-500">Evidence</div>
                  <div className="mt-1 text-sm text-zinc-200">
                    {evidence.phaseEvidence.length} phases
                  </div>
                </div>
              </div>
              <div className="grid gap-2 p-4 text-xs text-zinc-400 md:grid-cols-2">
                {evidence.verificationCommands.map((command) => (
                  <code key={command} className="rounded-md bg-zinc-950 px-2 py-1 text-zinc-200">
                    {command}
                  </code>
                ))}
              </div>
            </div>
          </section>

          <section aria-labelledby="release-gate">
            <div className="mb-3 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-cyan-300" aria-hidden="true" />
              <h2 id="release-gate" className="text-lg font-semibold text-white">
                Release Gate
              </h2>
            </div>
            <div className="rounded-md border border-zinc-800 bg-zinc-900/80">
              <div className="grid gap-3 border-b border-zinc-800 p-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-medium uppercase text-zinc-500">Status</div>
                  <div className="mt-1 text-sm text-cyan-100">{releaseGate.status}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-zinc-500">Production</div>
                  <div className="mt-1 text-sm text-zinc-200">{releaseGate.productionUrl}</div>
                </div>
              </div>
              <div className="grid gap-2 p-4">
                {releaseGate.checks.map((check) => (
                  <div
                    key={check.id}
                    className="flex items-start justify-between gap-3 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2"
                  >
                    <div>
                      <div className="text-sm text-zinc-200">{check.label}</div>
                      <div className="mt-1 text-xs text-zinc-500">{check.evidence}</div>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-1 text-xs ${
                        check.status === "pass"
                          ? statusTone
                          : "border-amber-500/40 bg-amber-500/10 text-amber-100"
                      }`}
                    >
                      {check.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section aria-labelledby="promotion-checklist">
            <div className="mb-3 flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-emerald-300" aria-hidden="true" />
              <h2 id="promotion-checklist" className="text-lg font-semibold text-white">
                Promotion Checklist
              </h2>
            </div>
            <div className="rounded-md border border-zinc-800 bg-zinc-900/80">
              <div className="border-b border-zinc-800 p-4">
                <div className="text-xs font-medium uppercase text-zinc-500">Status</div>
                <div className="mt-1 text-sm text-emerald-100">{promotionChecklist.status}</div>
              </div>
              <div className="grid gap-2 p-4">
                {promotionChecklist.steps.map((step) => (
                  <div
                    key={step.id}
                    className="grid gap-3 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 md:grid-cols-[32px_1fr_auto]"
                  >
                    <div className="text-sm font-semibold text-zinc-400">{step.order}</div>
                    <div>
                      <div className="text-sm text-zinc-200">{step.title}</div>
                      <div className="mt-1 text-xs text-zinc-500">{step.evidence}</div>
                    </div>
                    <span
                      className={`h-fit rounded-md border px-2 py-1 text-xs ${
                        step.status === "complete"
                          ? statusTone
                          : "border-amber-500/40 bg-amber-500/10 text-amber-100"
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <section aria-labelledby="release-dashboard" className="rounded-md border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="mb-3 flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-cyan-300" aria-hidden="true" />
              <h2 id="release-dashboard" className="text-lg font-semibold text-white">
                Release Dashboard
              </h2>
            </div>
            <div className="grid gap-2">
              {releaseDashboard.dashboardCards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-medium uppercase text-zinc-500">
                        {card.label}
                      </div>
                      <div className="mt-1 text-sm text-zinc-200">{card.value}</div>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-1 text-xs ${
                        card.tone === "ready"
                          ? statusTone
                          : "border-amber-500/40 bg-amber-500/10 text-amber-100"
                      }`}
                    >
                      {card.tone}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="stage-5-health" className="rounded-md border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="mb-3 flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-emerald-300" aria-hidden="true" />
              <h2 id="stage-5-health" className="text-lg font-semibold text-white">
                Health
              </h2>
            </div>
            <div className="grid gap-3 text-sm">
              <div className={`rounded-md border px-3 py-2 ${statusTone}`}>{health.status}</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                <div className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2">
                  {health.phaseCount} phases
                </div>
                <div className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2">
                  {health.apiSurfaceCount} APIs
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="operator-brief" className="rounded-md border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="mb-3 flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-emerald-300" aria-hidden="true" />
              <h2 id="operator-brief" className="text-lg font-semibold text-white">
                Operator Brief
              </h2>
            </div>
            <div className="space-y-3">
              <p className="text-sm leading-6 text-zinc-200">{operatorBrief.headline}</p>
              <div className="grid gap-2 text-xs text-zinc-400">
                {operatorBrief.summary.map((item) => (
                  <div key={item} className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section aria-labelledby="deployment-summary" className="rounded-md border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="mb-3 flex items-center gap-2">
              <PanelTop className="h-5 w-5 text-cyan-300" aria-hidden="true" />
              <h2 id="deployment-summary" className="text-lg font-semibold text-white">
                Deployment
              </h2>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs font-medium uppercase text-zinc-500">Status</div>
                <div className="mt-1 text-cyan-100">{deploymentSummary.status}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-zinc-500">API Surface</div>
                <div className="mt-1 text-zinc-200">{deploymentSummary.apiSurface.length} endpoints</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-zinc-500">Operator Checks</div>
                <div className="mt-1 text-zinc-200">{deploymentSummary.operatorRequiredCount}</div>
              </div>
            </div>
          </section>

          <section aria-labelledby="verification" className="rounded-md border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-300" aria-hidden="true" />
              <h2 id="verification" className="text-lg font-semibold text-white">
                Verification
              </h2>
            </div>
            <div className="space-y-3">
              {verification.map(([label, value]) => (
                <div key={label} className="border-b border-zinc-800 pb-3 last:border-b-0 last:pb-0">
                  <div className="text-xs font-medium uppercase text-zinc-500">{label}</div>
                  <div className="mt-1 text-sm text-zinc-200">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="governance" className="rounded-md border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="mb-3 flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-amber-300" aria-hidden="true" />
              <h2 id="governance" className="text-lg font-semibold text-white">
                Governance
              </h2>
            </div>
            <ul className="space-y-2 text-sm text-zinc-300">
              {snapshot.governanceBoundaries.map((boundary) => (
                <li key={boundary} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                  <span>{boundary}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="artifacts" className="rounded-md border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-300" aria-hidden="true" />
              <h2 id="artifacts" className="text-lg font-semibold text-white">
                Artifacts
              </h2>
            </div>
            <div className="grid gap-2 text-sm">
              <Link
                href="/api/gamma/stage-5/readiness"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Readiness API
              </Link>
              <Link
                href="/api/gamma/stage-5/evidence"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Evidence API
              </Link>
              <Link
                href="/api/gamma/stage-5/release-gate"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Release Gate API
              </Link>
              <Link
                href="/api/gamma/stage-5/promotion-checklist"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Promotion Checklist API
              </Link>
              <Link
                href="/api/gamma/stage-5/deployment-summary"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Deployment Summary API
              </Link>
              <Link
                href="/api/gamma/stage-5/operator-brief"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Operator Brief API
              </Link>
              <Link
                href="/api/gamma/stage-5/health"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Health API
              </Link>
              <Link
                href="/api/gamma/stage-5/release-dashboard"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Release Dashboard API
              </Link>
              <Link
                href="/api/gamma/stage-5/api-manifest"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                API Manifest
              </Link>
              <Link
                href="/api/gamma/stage-5/openapi"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                OpenAPI
              </Link>
              <Link
                href="/api/gamma/stage-5/sdk"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                SDK Descriptor
              </Link>
              <Link
                href="/api/gamma/stage-5/contract-digest"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Contract Digest
              </Link>
              <Link
                href="/api/gamma/stage-5/release-attestation"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Release Attestation
              </Link>
              <Link
                href="/api/gamma/stage-5/rollback-plan"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Rollback Plan
              </Link>
              <Link
                href="/api/gamma/stage-5/operator-handoff"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Operator Handoff
              </Link>
              <Link
                href="/api/gamma/stage-5/audit-ledger"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Audit Ledger
              </Link>
              <Link
                href="/api/gamma/stage-5/deployment-receipt"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Deployment Receipt
              </Link>
              <Link
                href="/api/gamma/stage-5/promotion-journal"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Promotion Journal
              </Link>
              <Link
                href="/api/gamma/stage-5/operator-signoff"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Operator Signoff
              </Link>
              <Link
                href="/api/gamma/stage-5/evidence-index"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Evidence Index
              </Link>
              <Link
                href="/api/gamma/stage-5/release-bundle"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Release Bundle
              </Link>
              <Link
                href="/api/gamma/stage-5/release-archive-manifest"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Archive Manifest
              </Link>
              <Link
                href="/api/gamma/stage-5/release-retention-policy"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Retention Policy
              </Link>
              <Link
                href="/api/gamma/stage-5/release-compliance-matrix"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Compliance Matrix
              </Link>
              <Link
                href="/gamma-studio"
                className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Gamma Studio
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
