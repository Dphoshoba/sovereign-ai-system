import { PUBLICATION_TIME_ZONE } from "../../../lib/publishing/adelaide-time"

export function AdelaideTimezoneHint({
  style,
}: {
  style?: React.CSSProperties
}) {
  return (
    <p
      style={{
        margin: "6px 0 0",
        fontSize: 13,
        color: "var(--muted)",
        ...style,
      }}
    >
      Timezone: {PUBLICATION_TIME_ZONE}. Daylight saving is applied
      automatically.
    </p>
  )
}
