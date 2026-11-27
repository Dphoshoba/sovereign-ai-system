/**
 * Local YouTube media worker entrypoint.
 *
 * Usage:
 *   npx tsx scripts/youtube-media-worker.ts --health
 *   npx tsx scripts/youtube-media-worker.ts --prepare-demo
 *   npx tsx scripts/youtube-media-worker.ts --once
 *   npx tsx scripts/youtube-media-worker.ts --loop
 *
 * Intended runtime: Director's dedicated local machine (Node + ffmpeg-static),
 * NOT Vercel serverless and NOT assumed to be any specific cloud validation host.
 */

import {
  ensureWorkerFixtures,
  prepareRepresentativeFixturePackage,
  reportYoutubeWorkerHealth,
  runYoutubeWorkerOnce,
} from "../lib/youtube/worker/media-worker"

function parseArgs(argv: string[]) {
  return {
    health: argv.includes("--health"),
    prepareDemo: argv.includes("--prepare-demo"),
    once: argv.includes("--once"),
    loop: argv.includes("--loop"),
    intervalMs: (() => {
      const idx = argv.indexOf("--interval-ms")
      if (idx >= 0 && argv[idx + 1]) return Number(argv[idx + 1])
      return 15000
    })(),
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const cwd = process.cwd()

  if (args.health || (!args.prepareDemo && !args.once && !args.loop)) {
    const health = reportYoutubeWorkerHealth(cwd)
    console.log(JSON.stringify({ event: "youtube-worker-health", ...health }, null, 2))
    if (!args.prepareDemo && !args.once && !args.loop) {
      process.exit(health.ready ? 0 : 2)
    }
  }

  if (args.prepareDemo) {
    ensureWorkerFixtures(cwd)
    const demo = await prepareRepresentativeFixturePackage({
      actor: "youtube-media-worker-cli",
      cwd,
    })
    console.log(
      JSON.stringify(
        {
          event: "youtube-worker-prepare-demo",
          ok: demo.ok,
          articleId: demo.articleId,
          youtubePostId: demo.youtubePostId,
          packageFingerprint: demo.packageFingerprint,
          assets: demo.assets,
          note: demo.note,
        },
        null,
        2,
      ),
    )
  }

  if (args.once || args.loop) {
    const { prisma } = await import("../lib/prisma")
    const store = prisma as unknown as Parameters<
      typeof runYoutubeWorkerOnce
    >[0]["store"]

    const runOnce = async () => {
      const result = await runYoutubeWorkerOnce({ store, cwd })
      console.log(
        JSON.stringify(
          {
            event: "youtube-worker-tick",
            jobId: result.job?.id ?? null,
            jobType: result.job?.type ?? null,
            ready: result.health.ready,
            result: result.result ?? null,
          },
          null,
          2,
        ),
      )
      return result
    }

    if (args.once) {
      await runOnce()
      return
    }

    console.log(
      JSON.stringify({
        event: "youtube-worker-loop-start",
        intervalMs: args.intervalMs,
        runtime: reportYoutubeWorkerHealth(cwd).runtime,
      }),
    )
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        await runOnce()
      } catch (error) {
        console.error(
          JSON.stringify({
            event: "youtube-worker-tick-error",
            error: error instanceof Error ? error.message : String(error),
          }),
        )
      }
      await new Promise((r) => setTimeout(r, args.intervalMs))
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
