import { prisma } from "@/lib/prisma"
import SocialPostCard from "./SocialPostCard"

export default async function AdminSocialPage() {
  const posts = await prisma.socialPost.findMany({
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
          Social Distribution Center
        </h1>

        <p className="mt-3 text-zinc-400">
          AI-generated social content for intelligent distribution workflows.
        </p>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          Total posts: <strong>{posts.length}</strong>
        </div>

        <div className="mt-8 grid gap-5">
          {posts.map((post) => (
            <SocialPostCard
              key={post.id}
              post={{
                id: post.id,
                platform: post.platform,
                content: post.content,
                status: post.status,
                articleId: post.articleId,
                createdAt: post.createdAt.toISOString(),
              }}
            />
          ))}

          {posts.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-400">
              No social posts yet.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}