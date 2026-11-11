import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  AUTHENTICATION_REQUIRED_BODY,
  EDITOR_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth"

const mockGetUser = vi.fn()
const sideEffects: string[] = []

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: mockGetUser },
  }),
}))

vi.mock("@/lib/prisma", () => {
  function prismaNode(): unknown {
    const node = new Proxy(function prismaCall() {}, {
      get(_target, property) {
        if (property === "then") return undefined
        sideEffects.push(String(property))
        return prismaNode()
      },
      apply() {
        sideEffects.push("call")
        return Promise.resolve(prismaNode())
      },
    })
    return node
  }
  return { prisma: prismaNode() }
})

vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: () => {
    sideEffects.push("openai")
    throw new Error("openai")
  },
}))

const root = path.resolve(__dirname, "../..")

function handlersIn(source: string) {
  const found: string[] = []
  const re = /export\s+async\s+function\s+(GET|POST|PATCH|PUT|DELETE)\s*\(/g
  let match: RegExpExecArray | null
  while ((match = re.exec(source))) {
    const start = match.index
    const next = source.indexOf("\nexport ", start + 10)
    const body = source.slice(start, next === -1 ? source.length : next)
    if (/requireEditorAuth\s*\(/.test(body)) found.push(match[1])
  }
  return found
}

function walk(dir: string, files: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (entry.name === "route.ts") files.push(full)
  }
  return files
}

const operations = walk(path.join(root, "app/api")).flatMap((file) =>
  handlersIn(fs.readFileSync(file, "utf8")).map((method) => ({ file, method }))
)

const strictOperations = operations.filter((operation) => {
  const file = operation.file.replace(/\\/g, "/")
  return !(operation.method === "POST" && file.endsWith("app/api/creator-audit/route.ts"))
})

function session(role: "editor" | "viewer" | null) {
  mockGetUser.mockResolvedValue({
    data: {
      user:
        role === null
          ? null
          : {
              id: `${role}-1`,
              email: `${role}@example.com`,
              app_metadata: { role },
            },
    },
    error: null,
  })
}

async function invoke(file: string, method: string) {
  const loaded = await import(pathToFileURL(file).href)
  const handler = loaded[method] as (
    request: Request,
    context: { params: Promise<Record<string, string>> }
  ) => Promise<Response>
  return handler(new Request("http://localhost/api", { method }), {
    params: Promise.resolve({ id: "fixture", platform: "youtube" }),
  })
}

describe("editor boundary on privileged API handlers", () => {
  beforeEach(() => {
    sideEffects.length = 0
    vi.clearAllMocks()
  })

  it("rejects anonymous callers before privileged work", async () => {
    expect(strictOperations.length).toBeGreaterThan(400)
    session(null)
    const failures: string[] = []
    for (const operation of strictOperations) {
      const label = `${operation.method} ${path.relative(root, operation.file)}`
      sideEffects.length = 0
      try {
        const response = await invoke(operation.file, operation.method)
        const body = await response.json()
        if (response.status !== 401 || body.code !== AUTHENTICATION_REQUIRED_BODY.code) {
          failures.push(`${label} status ${response.status}`)
        } else if (sideEffects.length > 0) {
          failures.push(`${label} side effects ${sideEffects.join(",")}`)
        }
      } catch (error) {
        failures.push(`${label} threw ${error instanceof Error ? error.message : "error"}`)
      }
    }
    expect(failures).toEqual([])
  }, 300000)

  it("rejects authenticated non-editors", async () => {
    session("viewer")
    const failures: string[] = []
    for (const operation of strictOperations) {
      const label = `${operation.method} ${path.relative(root, operation.file)}`
      sideEffects.length = 0
      try {
        const response = await invoke(operation.file, operation.method)
        if (response.status !== 403) failures.push(`${label} status ${response.status}`)
        else if (sideEffects.length > 0) failures.push(`${label} side effects`)
      } catch (error) {
        failures.push(`${label} threw ${error instanceof Error ? error.message : "error"}`)
      }
    }
    expect(failures).toEqual([])
  }, 300000)

  it("lets an editor pass the gate", async () => {
    session("editor")
    const failures: string[] = []
    for (const operation of strictOperations) {
      const label = `${operation.method} ${path.relative(root, operation.file)}`
      try {
        const response = await invoke(operation.file, operation.method)
        if (response.status === 401 || response.status === 403) {
          failures.push(`${label} status ${response.status}`)
        }
      } catch {
        // The handler ran past the gate and reached a mocked dependency.
      }
    }
    expect(failures).toEqual([])
  }, 300000)
})

describe("public and service routes stay outside the editor gate", () => {
  beforeEach(() => {
    sideEffects.length = 0
    session(null)
  })

  it("keeps newsletter signup public", async () => {
    const loaded = await import(
      pathToFileURL(path.join(root, "app/api/newsletter/route.ts")).href
    )
    const response = await loaded.POST(
      new Request("http://localhost/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "reader@example.com" }),
      })
    )
    expect(response.status).not.toBe(401)
    expect(response.status).not.toBe(403)
  })

  it("keeps health responses free of diagnostics", async () => {
    const health = await import(pathToFileURL(path.join(root, "app/api/health/route.ts")).href)
    const db = await import(pathToFileURL(path.join(root, "app/api/health/db/route.ts")).href)
    const healthResponse = await health.GET()
    const dbResponse = await db.GET()
    expect(Object.keys(await healthResponse.json())).toEqual(["ok"])
    expect(Object.keys(await dbResponse.json())).toEqual(["ok"])
  })

  it("keeps scheduled publishing on the cron boundary", async () => {
    const loaded = await import(
      pathToFileURL(path.join(root, "app/api/cron/publish-scheduled/route.ts")).href
    )
    const response = await loaded.POST(new Request("http://localhost/api/cron/publish-scheduled"))
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.code).not.toBe(EDITOR_FORBIDDEN_BODY.code)
  })
})
