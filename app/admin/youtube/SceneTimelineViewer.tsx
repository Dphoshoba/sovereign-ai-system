type TimelineItem = {
  start: number
  end: number
  duration?: number
  scene?: string
  broll?: string
  text?: string
  emotion?: string
  transition?: string
}

export default function SceneTimelineViewer({
  timeline,
}: {
  timeline: TimelineItem[]
}) {
  if (!timeline?.length) {
    return null
  }

  return (
    <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <h3 className="mb-4 text-lg font-bold text-white">
        Scene Timeline
      </h3>

      <div className="space-y-4">
        {timeline.map((item, index) => (
          <div
            key={index}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded bg-blue-500/20 px-2 py-1 text-blue-300">
                {item.start}s → {item.end}s
              </span>

              {item.duration && (
                <span className="rounded bg-purple-500/20 px-2 py-1 text-purple-300">
                  {item.duration}s
                </span>
              )}

              {item.emotion && (
                <span className="rounded bg-pink-500/20 px-2 py-1 text-pink-300">
                  {item.emotion}
                </span>
              )}

              {item.transition && (
                <span className="rounded bg-orange-500/20 px-2 py-1 text-orange-300">
                  {item.transition}
                </span>
              )}
            </div>

            <div className="mt-3 space-y-2 text-sm">
              {item.scene && (
                <p>
                  <span className="text-zinc-500">Scene:</span>{" "}
                  <span className="text-cyan-300">{item.scene}</span>
                </p>
              )}

              {item.broll && (
                <p>
                  <span className="text-zinc-500">B-roll:</span>{" "}
                  <span className="text-green-300">{item.broll}</span>
                </p>
              )}

              {item.text && (
                <p className="mt-2 text-zinc-300">{item.text}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
