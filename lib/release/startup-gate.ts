import { validateEnvironment } from "../security/startup-validation"

export type StartupGateStatus = "READY" | "REPORT_ONLY" | "BLOCKED"

export type StartupGate = {
  ok: true
  readOnly: true
  writesToPrisma: false
  startupGateReady: boolean
  startupGateStatus: StartupGateStatus
  enforcementEnabled: false
  score: number
  missingRequired: string[]
  requiredChecks: string[]
  recommendedActions: string[]
}

export function buildStartupGate(): StartupGate {
  const environment = validateEnvironment()
  const requiredChecks = ["DATABASE_URL", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_BASE_URL"]
  const startupGateReady = environment.missingRequired.length === 0

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    startupGateReady,
    startupGateStatus: startupGateReady ? "REPORT_ONLY" : "BLOCKED",
    enforcementEnabled: false,
    score: environment.score,
    missingRequired: environment.missingRequired,
    requiredChecks,
    recommendedActions: [
      "Keep startup gate report-only in RC-4.",
      "Approve boot enforcement only after environment parity is confirmed.",
      "Add a failing startup test in RC-5 before enabling production boot enforcement.",
    ],
  }
}
