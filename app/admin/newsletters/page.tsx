import Link from "next/link"
import { prisma } from "@/lib/prisma"
import SendNewsletterButton from "./SendNewsletterButton"

export default async function AdminNewslettersPage() {
  const drafts = await prisma.newsletterDraft.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-blue-400">
              Echoes & Visions
            </p>
            <h1 className="mt-2 text-4xl font-bold">
              Newsletter Drafts
            </h1>
            <p className="mt-3 text-zinc-400">
              Review AI-generated newsletter drafts created from published articles.
            </p>
          </div>

          <Link
            href="/admin/articles"
            className="rounded-xl bg-white px-5 py-3 font-semibold text-zinc-950 hover:bg-zinc-200"
          >
            Back to Articles
          </Link>
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-zinc-300">
            Total drafts:{" "}
            <span className="font-bold text-white">{drafts.length}</span>
          </p>
        </div>

        <div className="grid gap-5">
          {drafts.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-400">
              No newsletter drafts yet.
            </div>
          ) : (
            drafts.map((draft) => (
              <article
                key={draft.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-300">
                    {draft.status}
                  </span>

                  <span className="text-sm text-zinc-500">
                    {new Date(draft.createdAt).toLocaleString()}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-white">
                  {draft.subject}
                </h2>

                {draft.previewText && (
                  <p className="mt-3 text-zinc-300">
                    {draft.previewText}
                  </p>
                )}

                <div className="mt-5 rounded-xl border border-zinc-800 bg-black/40 p-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                    {draft.body.length > 900
                      ? `${draft.body.slice(0, 900)}...`
                      : draft.body}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/admin/newsletters/${draft.id}`}
                    className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-500"
                  >
                    View Draft
                  </Link>

                  {draft.status !== "sent" && (
                    <SendNewsletterButton draftId={draft.id} />
                  )}

                  <span className="rounded-xl border border-zinc-700 px-5 py-2 text-sm text-zinc-400">
                    Article ID: {draft.articleId || "None"}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  )
}