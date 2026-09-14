export const PUBLICATION_TIME_ZONE = "Australia/Adelaide"

export const NAIVE_SCHEDULE_ERROR =
  "Schedule time must include a UTC offset or Z. Naive timestamps are not accepted."

export const INVALID_SCHEDULE_ERROR = "Invalid schedule date."

export type ScheduleParseSuccess = {
  ok: true
  date: Date
  iso: string
}

export type ScheduleParseFailure = {
  ok: false
  error: string
}

export type ScheduleParseResult = ScheduleParseSuccess | ScheduleParseFailure

const EXPLICIT_OFFSET_PATTERN = /(?:Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d)$/i
const WALL_CLOCK_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/

type ZoneParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function zoneParts(instant: Date, timeZone: string): ZoneParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant)

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  }
}

function offsetMsAt(instant: Date, timeZone: string) {
  const parts = zoneParts(instant, timeZone)
  const wallAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  )
  return wallAsUtc - instant.getTime()
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function formatOffset(offsetMs: number) {
  const sign = offsetMs >= 0 ? "+" : "-"
  const absolute = Math.abs(offsetMs)
  const hours = Math.floor(absolute / 3_600_000)
  const minutes = Math.floor((absolute % 3_600_000) / 60_000)
  return `${sign}${pad(hours)}:${pad(minutes)}`
}

export function hasExplicitUtcOffset(value: string) {
  return EXPLICIT_OFFSET_PATTERN.test(value.trim())
}

export function formatInstantWithTimeZone(
  instant: Date,
  timeZone = PUBLICATION_TIME_ZONE
) {
  const parts = zoneParts(instant, timeZone)
  const offset = formatOffset(offsetMsAt(instant, timeZone))
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}${offset}`
}

export function instantToAdelaideWallClock(value: Date | string) {
  const instant = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(instant.getTime())) return ""

  const parts = zoneParts(instant, PUBLICATION_TIME_ZONE)
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`
}

export function formatAdelaideDisplay(value: Date | string | null | undefined) {
  if (!value) return "Not scheduled"

  const instant = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(instant.getTime())) return "Not scheduled"

  return new Intl.DateTimeFormat("en-AU", {
    timeZone: PUBLICATION_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "shortOffset",
  }).format(instant)
}

export function fromAdelaideWallClock(value: string): ScheduleParseResult {
  const match = value.trim().match(WALL_CLOCK_PATTERN)
  if (!match) {
    return { ok: false, error: INVALID_SCHEDULE_ERROR }
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6] || "0")

  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, second)
  if (Number.isNaN(wallAsUtc)) {
    return { ok: false, error: INVALID_SCHEDULE_ERROR }
  }

  let utcMillis = wallAsUtc
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offset = offsetMsAt(new Date(utcMillis), PUBLICATION_TIME_ZONE)
    utcMillis = wallAsUtc - offset
  }

  const date = new Date(utcMillis)
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: INVALID_SCHEDULE_ERROR }
  }

  const roundTrip = zoneParts(date, PUBLICATION_TIME_ZONE)
  if (
    roundTrip.year !== year ||
    roundTrip.month !== month ||
    roundTrip.day !== day ||
    roundTrip.hour !== hour ||
    roundTrip.minute !== minute ||
    roundTrip.second !== second
  ) {
    return {
      ok: false,
      error:
        "That local time does not exist in Australia/Adelaide because of daylight saving.",
    }
  }

  return {
    ok: true,
    date,
    iso: formatInstantWithTimeZone(date),
  }
}

export function parseSchedulingTimestamp(value: unknown): ScheduleParseResult {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, error: INVALID_SCHEDULE_ERROR }
  }

  const trimmed = value.trim()
  if (!hasExplicitUtcOffset(trimmed)) {
    return { ok: false, error: NAIVE_SCHEDULE_ERROR }
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: INVALID_SCHEDULE_ERROR }
  }

  return {
    ok: true,
    date,
    iso: formatInstantWithTimeZone(date),
  }
}

export function parseOptionalSchedulingTimestamp(
  value: unknown
): ScheduleParseResult | { ok: true; date: null; iso: null } {
  if (value == null || value === "") {
    return { ok: true, date: null, iso: null }
  }

  return parseSchedulingTimestamp(value)
}
