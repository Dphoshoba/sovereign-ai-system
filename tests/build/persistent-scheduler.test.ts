import { beforeEach, describe, expect, it, vi } from "vitest"

const schedule = vi.hoisted(() => vi.fn())
const findMany = vi.hoisted(() => vi.fn())

vi.mock("node-cron", () => ({
  default: {
    schedule,
  },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    videoPerformanceMemory: {
      findMany,
    },
  },
}))

function directorRequest() {
  return new Request("http://localhost/api/agents/director", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  })
}

describe("persistent autonomous scheduler", () => {
  beforeEach(() => {
    schedule.mockClear()
    findMany.mockResolvedValue([])
  })

  it("does not start during import and starts once when the director route runs", async () => {
    const route = await import("../../app/api/agents/director/route")
    expect(schedule).not.toHaveBeenCalled()

    const first = await route.POST(directorRequest() as never)
    expect(first.status).toBe(200)
    expect(schedule).toHaveBeenCalledTimes(1)
    expect(schedule).toHaveBeenCalledWith("0 */6 * * *", expect.any(Function))

    const second = await route.POST(directorRequest() as never)
    expect(second.status).toBe(200)
    expect(schedule).toHaveBeenCalledTimes(1)
  })
})
