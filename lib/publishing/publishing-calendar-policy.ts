/**
 * EV-EDITORIAL-07-P4 — Director-authorisable publishing slot policy.
 * Policies select slots only after individual article approval; they never
 * replace editorial approval or publication guards.
 */
import {
  PUBLICATION_TIME_ZONE,
  formatInstantWithTimeZone,
  fromAdelaideWallClock,
} from "./adelaide-time"

export type PublishingSlotPolicy = {
  timeZone: string
  /** Local hour (0–23) allowed for publication. */
  allowedLocalHours: number[]
  /** Local minute for each slot. */
  slotMinute: number
  /** Minimum days between successive scheduled publications. */
  cadenceDays: number
  /** Weekdays 1=Mon … 7=Sun. Empty = any day. */
  allowedWeekdays: number[]
}

export const DEFAULT_PUBLISHING_SLOT_POLICY: PublishingSlotPolicy = {
  timeZone: PUBLICATION_TIME_ZONE,
  allowedLocalHours: [9, 12, 18],
  slotMinute: 0,
  cadenceDays: 1,
  allowedWeekdays: [1, 2, 3, 4, 5],
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function adelaideParts(instant: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PUBLICATION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(instant)

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)

  const weekdayName = parts.find((part) => part.type === "weekday")?.value || ""
  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  }

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    weekday: weekdayMap[weekdayName] ?? 0,
  }
}

function isAllowedWeekday(policy: PublishingSlotPolicy, weekday: number) {
  if (!policy.allowedWeekdays.length) return true
  return policy.allowedWeekdays.includes(weekday)
}

/**
 * Returns the next free Adelaide wall-clock slot as an ISO string with offset.
 * Occupied slots are existing `scheduledFor` UTC instants.
 */
export function nextPublishingSlot(input: {
  policy?: PublishingSlotPolicy
  from?: Date
  occupiedUtc?: Array<Date | string | null | undefined>
}): string {
  const policy = input.policy ?? DEFAULT_PUBLISHING_SLOT_POLICY
  const occupied = new Set(
    (input.occupiedUtc || [])
      .filter(Boolean)
      .map((value) => new Date(value as Date | string).getTime())
      .filter((ms) => Number.isFinite(ms)),
  )

  const from = input.from ?? new Date()
  const startParts = adelaideParts(from)

  for (let dayOffset = 0; dayOffset < 90; dayOffset += 1) {
    const probe = new Date(from.getTime() + dayOffset * 24 * 60 * 60 * 1000)
    const dayParts = adelaideParts(probe)
    if (!isAllowedWeekday(policy, dayParts.weekday)) continue

    for (const hour of policy.allowedLocalHours) {
      if (dayOffset === 0 && hour < startParts.hour) continue
      if (
        dayOffset === 0 &&
        hour === startParts.hour &&
        policy.slotMinute <= startParts.minute
      ) {
        continue
      }

      const wall = `${dayParts.year}-${pad(dayParts.month)}-${pad(dayParts.day)}T${pad(hour)}:${pad(policy.slotMinute)}:00`
      const parsed = fromAdelaideWallClock(wall)
      if (!parsed.ok) continue
      if (parsed.date.getTime() <= from.getTime()) continue
      if (occupied.has(parsed.date.getTime())) continue

      if (policy.cadenceDays > 0 && occupied.size > 0) {
        const latestBefore = [...occupied]
          .filter((ms) => ms < parsed.date.getTime())
          .sort((a, b) => b - a)[0]
        if (latestBefore != null) {
          const gapDays =
            (parsed.date.getTime() - latestBefore) / (24 * 60 * 60 * 1000)
          if (gapDays < policy.cadenceDays) continue
        }
      }

      return parsed.iso
    }
  }

  const fallbackDay = new Date(from.getTime() + Math.max(1, policy.cadenceDays) * 86400000)
  const parts = adelaideParts(fallbackDay)
  const hour = policy.allowedLocalHours[0] ?? 12
  const wall = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(hour)}:${pad(policy.slotMinute)}:00`
  const parsed = fromAdelaideWallClock(wall)
  if (parsed.ok) return parsed.iso
  return formatInstantWithTimeZone(
    new Date(from.getTime() + Math.max(1, policy.cadenceDays) * 86400000),
  )
}

export function assertSlotNotEarly(isoWithOffset: string, now = new Date()): boolean {
  const when = new Date(isoWithOffset)
  if (Number.isNaN(when.getTime())) return false
  return when.getTime() > now.getTime()
}
