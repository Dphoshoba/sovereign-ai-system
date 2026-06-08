const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(
  /\/+$/,
  ""
)

const ROUTES: { group: string; path: string }[] = [
  { group: "public", path: "/api/health" },
  { group: "executive", path: "/api/executive/health" },
  { group: "executive", path: "/api/executive/runtime" },
  { group: "executive", path: "/api/executive/command-center" },
  { group: "executive", path: "/api/executive/boardroom" },
  { group: "executive", path: "/api/executive/forecast" },
  { group: "executive", path: "/api/executive/strategic-plan" },
  { group: "executive", path: "/api/executive/goals" },
  { group: "executive", path: "/api/executive/knowledge-graph" },
  { group: "executive", path: "/api/executive/simulations" },
  { group: "executive", path: "/api/executive/scenarios" },
  { group: "admin", path: "/admin/runtime" },
  { group: "admin", path: "/admin/command-center" },
  { group: "admin", path: "/admin/operations" },
  { group: "admin", path: "/admin/boardroom" },
  { group: "admin", path: "/admin/strategic-plan" },
  { group: "admin", path: "/admin/goals" },
  { group: "admin", path: "/admin/knowledge-graph" },
  { group: "admin", path: "/admin/simulations" },
  { group: "admin", path: "/admin/scenarios" },
  { group: "admin", path: "/admin/revenue" },
  { group: "admin", path: "/admin/delivery" },
]

type RouteResult = {
  group: string
  path: string
  statusCode: number | null
  pass: boolean
  error?: string
  latencyMs: number
}

function passesStatus(statusCode: number) {
  return statusCode >= 200 && statusCode <= 399
}

async function checkRoute(route: {
  group: string
  path: string
}): Promise<RouteResult> {
  const url = `${BASE_URL}${route.path}`
  const started = Date.now()

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(60_000),
      headers: {
        Accept: "application/json, text/html;q=0.9,*/*;q=0.8",
      },
    })

    const latencyMs = Date.now() - started
    const statusCode = response.status

    return {
      group: route.group,
      path: route.path,
      statusCode,
      pass: passesStatus(statusCode),
      latencyMs,
    }
  } catch (error) {
    return {
      group: route.group,
      path: route.path,
      statusCode: null,
      pass: false,
      latencyMs: Date.now() - started,
      error:
        error instanceof Error ? error.message : "Request failed",
    }
  }
}

function pad(value: string, width: number) {
  return value.length >= width ? value.slice(0, width) : value.padEnd(width)
}

function printReport(results: RouteResult[]) {
  const statusWidth = 6
  const codeWidth = 6
  const groupWidth = 10
  const pathWidth = 40
  const latencyWidth = 10

  console.log("")
  console.log(`Sovereign V1 smoke test — ${BASE_URL}`)
  console.log("")
  console.log(
    [
      pad("RESULT", statusWidth),
      pad("CODE", codeWidth),
      pad("GROUP", groupWidth),
      pad("ROUTE", pathWidth),
      pad("LATENCY", latencyWidth),
      "NOTES",
    ].join("  ")
  )
  console.log("-".repeat(90))

  for (const result of results) {
    const code =
      result.statusCode == null ? "—" : String(result.statusCode)
    const notes = result.error ?? ""

    console.log(
      [
        pad(result.pass ? "PASS" : "FAIL", statusWidth),
        pad(code, codeWidth),
        pad(result.group, groupWidth),
        pad(result.path, pathWidth),
        pad(`${result.latencyMs}ms`, latencyWidth),
        notes,
      ].join("  ")
    )
  }

  const passed = results.filter((result) => result.pass).length
  const failed = results.length - passed

  console.log("")
  console.log(`Summary: ${passed} passed, ${failed} failed, ${results.length} total`)
}

async function main() {
  console.log(`Testing ${ROUTES.length} routes against ${BASE_URL} ...`)

  const results: RouteResult[] = []

  for (const route of ROUTES) {
    const result = await checkRoute(route)
    results.push(result)
  }

  printReport(results)

  const allPassed = results.every((result) => result.pass)
  process.exit(allPassed ? 0 : 1)
}

main().catch((error) => {
  console.error("Smoke test crashed:", error)
  process.exit(1)
})
