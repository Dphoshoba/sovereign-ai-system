import { describe, expect, it } from "vitest"
import { publishDueArticles } from "../../lib/publishing/publish-due-articles"
import {
  NAIVE_SCHEDULE_ERROR,
  formatInstantWithTimeZone,
  fromAdelaideWallClock,
  instantToAdelaideWallClock,
  parseOptionalSchedulingTimestamp,
  parseSchedulingTimestamp,
} from "../../lib/publishing/adelaide-time"

describe("Adelaide publication timezone", () => {
  it("converts Adelaide standard time (UTC+09:30) to the correct instant", () => {
    const parsed = fromAdelaideWallClock("2026-09-14T13:02")

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    expect(parsed.date.toISOString()).toBe("2026-09-14T03:32:00.000Z")
    expect(parsed.iso).toBe("2026-09-14T13:02:00+09:30")
  })

  it("converts Adelaide daylight time (UTC+10:30) to the correct instant", () => {
    const parsed = fromAdelaideWallClock("2026-12-15T13:02")

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    expect(parsed.date.toISOString()).toBe("2026-12-15T02:32:00.000Z")
    expect(parsed.iso).toBe("2026-12-15T13:02:00+10:30")
  })

  it("round-trips a client wall-clock value through the UTC server parser", () => {
    const client = fromAdelaideWallClock("2026-09-14T13:02")
    expect(client.ok).toBe(true)
    if (!client.ok) return

    const server = parseSchedulingTimestamp(client.iso)
    expect(server.ok).toBe(true)
    if (!server.ok) return

    expect(server.date.toISOString()).toBe("2026-09-14T03:32:00.000Z")
    expect(instantToAdelaideWallClock(server.date)).toBe("2026-09-14T13:02")
    expect(formatInstantWithTimeZone(server.date)).toBe(client.iso)
  })

  it("keeps the same instant when the production server is UTC", () => {
    const parsed = parseSchedulingTimestamp("2026-09-14T13:02:00+09:30")
    const asUtcZ = parseSchedulingTimestamp("2026-09-14T13:02:00Z")

    expect(parsed.ok).toBe(true)
    expect(asUtcZ.ok).toBe(true)
    if (!parsed.ok || !asUtcZ.ok) return

    expect(parsed.date.toISOString()).toBe("2026-09-14T03:32:00.000Z")
    expect(asUtcZ.date.toISOString()).toBe("2026-09-14T13:02:00.000Z")
    expect(parseSchedulingTimestamp("2026-09-14T13:02").ok).toBe(false)
  })

  it("rejects offset-free scheduling timestamps instead of reinterpreting them", () => {
    expect(parseSchedulingTimestamp("2026-09-14T13:02")).toEqual({
      ok: false,
      error: NAIVE_SCHEDULE_ERROR,
    })
    expect(parseSchedulingTimestamp("2026-09-14T13:02:00")).toEqual({
      ok: false,
      error: NAIVE_SCHEDULE_ERROR,
    })
  })

  it("rejects invalid dates", () => {
    expect(parseSchedulingTimestamp("not-a-dateZ").ok).toBe(false)
    expect(parseSchedulingTimestamp("invalidZ").ok).toBe(false)
    expect(fromAdelaideWallClock("not-a-date").ok).toBe(false)
  })

  it("redisplays a stored instant as Australia/Adelaide wall-clock time", () => {
    expect(instantToAdelaideWallClock("2026-09-14T03:32:00.000Z")).toBe(
      "2026-09-14T13:02"
    )
    expect(instantToAdelaideWallClock("2026-12-15T02:32:00.000Z")).toBe(
      "2026-12-15T13:02"
    )
  })

  it("selects a due article at the intended Adelaide instant", async () => {
    const scheduled = fromAdelaideWallClock("2026-09-14T13:02")
    expect(scheduled.ok).toBe(true)
    if (!scheduled.ok) return

    function createStore(now: Date) {
      const rows =
        scheduled.date <= now
          ? [
              {
                id: "due-adelaide",
                status: "scheduled" as const,
                scheduledFor: scheduled.date,
              },
            ]
          : []

      return {
        article: {
          findMany: async () => rows,
          updateMany: async () => ({ count: rows.length }),
        },
      }
    }

    const before = await publishDueArticles({
      now: new Date("2026-09-14T03:31:59.000Z"),
      source: "test",
      prisma: createStore(new Date("2026-09-14T03:31:59.000Z")),
      afterPublish: async () => {},
    })
    const after = await publishDueArticles({
      now: new Date("2026-09-14T03:32:00.000Z"),
      source: "test",
      prisma: createStore(new Date("2026-09-14T03:32:00.000Z")),
      afterPublish: async () => {},
    })

    expect(before.eligible).toBe(0)
    expect(before.published).toBe(0)
    expect(after.eligible).toBe(1)
    expect(after.published).toBe(1)
  })

  it("treats an empty optional timestamp as absent", () => {
    expect(parseOptionalSchedulingTimestamp("")).toEqual({
      ok: true,
      date: null,
      iso: null,
    })
    expect(parseOptionalSchedulingTimestamp(null)).toEqual({
      ok: true,
      date: null,
      iso: null,
    })
  })
})
