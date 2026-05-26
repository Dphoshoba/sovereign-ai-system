import Image from "next/image"
import { prisma } from "@/lib/prisma"
import CopyButton from "./CopyButton"
import UploadButton from "./UploadButton"
import ScheduleUploadButton from "./ScheduleUploadButton"
import ActionButton from "./ActionButton"
import SceneTimelineViewer from "./SceneTimelineViewer"

export default async function AdminYouTubePage() {
  const posts = await prisma.youTubePost.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm uppercase tracking-[0.25em] text-red-400">
          Echoes & Visions
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          YouTube Content Center
        </h1>

        <p className="mt-3 text-zinc-400">
          AI-generated YouTube titles, descriptions, tags, Shorts captions, thumbnail prompts, and script outlines.
        </p>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          Total YouTube drafts: <strong>{posts.length}</strong>
        </div>

        <div className="mt-8 grid gap-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-300">
                  {post.status}
                </span>

                <span className="text-sm text-zinc-500">
                  {new Intl.DateTimeFormat("en-AU", {
                    dateStyle: "short",
                    timeStyle: "short",
                    timeZone: "Australia/Adelaide",
                  }).format(new Date(post.createdAt))}
                </span>
              </div>

              {post.thumbnailImage && (
                <div className="mb-5 overflow-hidden rounded-2xl border border-zinc-800 bg-black">
                  <Image
                    src={post.thumbnailImage}
                    alt={post.title}
                    width={1280}
                    height={720}
                    className="h-auto w-full object-cover"
                  />
                </div>
              )}

              <div className="mt-5 flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold text-white">
                  {post.title}
                </h2>

                <CopyButton value={post.title} label="Copy Title" />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {post.uploadStatus !== "uploaded" && (
                  <UploadButton youtubePostId={post.id} />
                )}

                <ScheduleUploadButton youtubePostId={post.id} />

                <ActionButton
                  youtubePostId={post.id}
                  endpoint="/api/youtube/build-scene-timeline"
                  label="Build Timeline"
                  loadingLabel="Building..."
                  className="bg-blue-500 text-white hover:bg-blue-400"
                />

                <ActionButton
                  youtubePostId={post.id}
                  endpoint="/api/youtube/analyze-emotion"
                  label="Analyze Emotion"
                  loadingLabel="Analyzing..."
                  className="bg-pink-500 text-white hover:bg-pink-400"
                />

                <ActionButton
                  youtubePostId={post.id}
                  endpoint="/api/youtube/generate-subtitles"
                  label="Generate Subtitles"
                  loadingLabel="Generating..."
                  className="bg-purple-500 text-white hover:bg-purple-400"
                />

                <ActionButton
                  youtubePostId={post.id}
                  endpoint="/api/youtube/render-video"
                  label="Render Video"
                  loadingLabel="Rendering..."
                  className="bg-indigo-500 text-white hover:bg-indigo-400"
                />

                {post.uploadStatus === "uploaded" &&
                  post.youtubeUrl && (
                    <a
                      href={post.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400"
                    >
                      View on YouTube
                    </a>
                  )}
              </div>

              <div className="mt-4 grid gap-3 rounded-xl border border-zinc-800 bg-black/40 p-4 text-sm text-zinc-300">
                <p>
                  <span className="text-zinc-500">Upload Status:</span>{" "}
                  <span className="font-semibold text-emerald-300">
                    {post.uploadStatus || "draft"}
                  </span>
                </p>

                {post.renderStatus && (
                  <p>
                    <span className="text-zinc-500">Render Status:</span>{" "}
                    <span className="font-semibold text-purple-300">
                      {post.renderStatus}
                    </span>
                  </p>
                )}

                {post.selectedMusic && (
                  <p>
                    <span className="text-zinc-500">Selected Music:</span>{" "}
                    <span className="font-semibold text-cyan-300">
                      {post.selectedMusic}
                    </span>
                  </p>
                )}

                {post.renderedVideoUrl && (
                  <p>
                    <span className="text-zinc-500">Rendered Video:</span>{" "}
                    <a
                      href={post.renderedVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline hover:text-blue-300"
                    >
                      {post.renderedVideoUrl}
                    </a>
                  </p>
                )}

                {post.youtubeVideoId && (
                  <p>
                    <span className="text-zinc-500">YouTube Video ID:</span>{" "}
                    {post.youtubeVideoId}
                  </p>
                )}

                {post.youtubeUrl && (
                  <p>
                    <span className="text-zinc-500">YouTube URL:</span>{" "}
                    <a
                      href={post.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline hover:text-blue-300"
                    >
                      {post.youtubeUrl}
                    </a>
                  </p>
                )}

                {post.shortsStatus && (
                  <p>
                    <span className="text-zinc-500">Shorts Status:</span>{" "}
                    <span className="font-semibold text-yellow-300">
                      {post.shortsStatus}
                    </span>
                  </p>
                )}

                {post.shortsVideoId && (
                  <p>
                    <span className="text-zinc-500">Shorts Video ID:</span>{" "}
                    {post.shortsVideoId}
                  </p>
                )}

                {post.shortsUploadUrl && (
                  <p>
                    <span className="text-zinc-500">Shorts URL:</span>{" "}
                    <a
                      href={post.shortsUploadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline hover:text-blue-300"
                    >
                      {post.shortsUploadUrl}
                    </a>
                  </p>
                )}

                {post.thumbnailImage && (
                  <p>
                    <span className="text-zinc-500">Thumbnail:</span>{" "}
                    <span className="text-emerald-300">Generated and uploaded</span>
                  </p>
                )}
              </div>

              {Array.isArray(post.sceneTimeline) && (
                <SceneTimelineViewer
                  timeline={post.sceneTimeline as any[]}
                />
              )}

              <div className="mt-5 grid gap-5">
                <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-red-300">
                      Description
                    </h3>

                    <CopyButton value={post.description} label="Copy" />
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                    {post.description}
                  </p>
                </section>

                {post.tags && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">
                        Tags
                      </h3>

                      <CopyButton value={post.tags || ""} label="Copy" />
                    </div>
                    <p className="text-sm text-zinc-300">
                      {post.tags}
                    </p>
                  </section>
                )}

                {post.shortsCaption && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">
                        Shorts Caption
                      </h3>

                      <CopyButton
                        value={post.shortsCaption || ""}
                        label="Copy"
                      />
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.shortsCaption}
                    </p>
                  </section>
                )}

                {post.thumbnailPrompt && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">
                        Thumbnail Prompt
                      </h3>

                      <CopyButton
                        value={post.thumbnailPrompt || ""}
                        label="Copy"
                      />
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.thumbnailPrompt}
                    </p>
                  </section>
                )}

                {post.scriptOutline && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">
                        Script Outline
                      </h3>

                      <CopyButton
                        value={post.scriptOutline || ""}
                        label="Copy"
                      />
                    </div>
                    <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.scriptOutline}
                    </pre>
                  </section>
                )}

                {post.fullScript && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">Full Script</h3>
                      <CopyButton value={post.fullScript || ""} label="Copy" />
                    </div>

                    <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.fullScript}
                    </pre>
                  </section>
                )}

                {post.shortsHooks && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">Shorts Hooks</h3>
                      <CopyButton value={post.shortsHooks || ""} label="Copy" />
                    </div>

                    <pre className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.shortsHooks}
                    </pre>
                  </section>
                )}

                {post.retentionHooks && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">Retention Hooks</h3>
                      <CopyButton value={post.retentionHooks || ""} label="Copy" />
                    </div>

                    <pre className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.retentionHooks}
                    </pre>
                  </section>
                )}

                {post.chapterTimestamps && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">Chapter Timestamps</h3>
                      <CopyButton value={post.chapterTimestamps || ""} label="Copy" />
                    </div>

                    <pre className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.chapterTimestamps}
                    </pre>
                  </section>
                )}

                {post.cta && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">CTA</h3>
                      <CopyButton value={post.cta || ""} label="Copy" />
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.cta}
                    </p>
                  </section>
                )}

                {post.shortsIdeas && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">Shorts Ideas</h3>
                      <CopyButton value={post.shortsIdeas || ""} label="Copy" />
                    </div>

                    <pre className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.shortsIdeas}
                    </pre>
                  </section>
                )}

                {post.shortsScripts && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">Shorts Scripts</h3>
                      <CopyButton value={post.shortsScripts || ""} label="Copy" />
                    </div>

                    <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.shortsScripts}
                    </pre>
                  </section>
                )}

                {post.editingNotes && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">Editing Notes</h3>
                      <CopyButton value={post.editingNotes || ""} label="Copy" />
                    </div>

                    <pre className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.editingNotes}
                    </pre>
                  </section>
                )}

                {post.pacingSuggestions && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">Pacing Suggestions</h3>
                      <CopyButton value={post.pacingSuggestions || ""} label="Copy" />
                    </div>

                    <pre className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.pacingSuggestions}
                    </pre>
                  </section>
                )}

                {post.viralAngles && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">Viral Angles</h3>
                      <CopyButton value={post.viralAngles || ""} label="Copy" />
                    </div>

                    <pre className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.viralAngles}
                    </pre>
                  </section>
                )}

                {post.scenePlan && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">Scene Plan</h3>
                      <CopyButton value={post.scenePlan || ""} label="Copy" />
                    </div>

                    <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.scenePlan}
                    </pre>
                  </section>
                )}

                {post.brollSuggestions && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">B-roll Suggestions</h3>
                      <CopyButton value={post.brollSuggestions || ""} label="Copy" />
                    </div>

                    <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.brollSuggestions}
                    </pre>
                  </section>
                )}

                {post.cameraDirections && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">Camera Directions</h3>
                      <CopyButton value={post.cameraDirections || ""} label="Copy" />
                    </div>

                    <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.cameraDirections}
                    </pre>
                  </section>
                )}

                {post.visualPrompts && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">Visual Prompts</h3>
                      <CopyButton value={post.visualPrompts || ""} label="Copy" />
                    </div>

                    <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.visualPrompts}
                    </pre>
                  </section>
                )}

                {post.shortsScenes && (
                  <section className="rounded-xl border border-zinc-800 bg-black/40 p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-red-300">Shorts Scenes</h3>
                      <CopyButton value={post.shortsScenes || ""} label="Copy" />
                    </div>

                    <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {post.shortsScenes}
                    </pre>
                  </section>
                )}
              </div>

              <div className="mt-5 text-sm text-zinc-500">
                Article ID: {post.articleId || "None"}
              </div>
            </article>
          ))}

          {posts.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-400">
              No YouTube drafts yet.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}