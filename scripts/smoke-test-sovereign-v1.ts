import { getGammaStage5SmokeRoutes } from "../src/lib/gamma-2/stage-5-surface-registry";

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(
  /\/+$/,
  ""
)

const ROUTES: { group: string; path: string }[] = getGammaStage5SmokeRoutes()

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
