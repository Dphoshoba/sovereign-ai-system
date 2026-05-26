import { prisma } from "@/lib/prisma"
import PublishButton from "./PublishButton"
import RetryButton from "./RetryButton"
import ScheduleButton from "./ScheduleButton"

export default async function PublishingQueuePage() {
  const queue = await prisma.publishingQueue.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm uppercase tracking-[0.25em] text-blue-400">
          Echoes & Visions
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Publishing Queue
        </h1>

        <p className="mt-3 text-zinc-400">
          Autonomous queue for blog, newsletter, social, YouTube, and Shorts distribution.
        </p>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          Total queue items: <strong>{queue.length}</strong>
        </div>

        <div className="mt-8 grid gap-5">
          {queue.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-400">
              No publishing queue items yet.
            </div>
          ) : (
            queue.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-300">
                      {item.platform}
                    </span>

                    <span className="rounded-full bg-purple-500/10 px-3 py-1 text-sm font-semibold text-purple-300">
                      {item.contentType}
                    </span>

                    <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
                      {item.status}
                    </span>
                  </div>

                  <span className="text-sm text-zinc-500">
                    {new Intl.DateTimeFormat("en-AU", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "Australia/Adelaide",
                    }).format(new Date(item.createdAt))}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {item.status !== "published" && (
                    <PublishButton queueId={item.id} />
                  )}

                  {item.status !== "published" && (
                    <ScheduleButton queueId={item.id} />
                  )}

                  {item.status === "failed" && (
                    <RetryButton queueId={item.id} />
                  )}
                </div>

                <div className="grid gap-3 text-sm text-zinc-300">
                  <p>
                    <span className="text-zinc-500">Article ID:</span>{" "}
                    {item.articleId}
                  </p>

                  {item.scheduledAt && (
                    <p>
                      <span className="text-zinc-500">Scheduled:</span>{" "}
                      {new Intl.DateTimeFormat("en-AU", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "Australia/Adelaide",
                      }).format(new Date(item.scheduledAt))}
                    </p>
                  )}

                  {item.publishedAt && (
                    <p>
                      <span className="text-zinc-500">Published:</span>{" "}
                      {new Intl.DateTimeFormat("en-AU", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "Australia/Adelaide",
                      }).format(new Date(item.publishedAt))}
                    </p>
                  )}
                </div>

                {item.payload && (
                  <pre className="mt-5 overflow-auto rounded-xl border border-zinc-800 bg-black/40 p-4 text-sm leading-7 text-zinc-300">
                    {JSON.stringify(JSON.parse(item.payload), null, 2)}
                  </pre>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  )
}