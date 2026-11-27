/**
 * Local YouTube media worker entrypoint.
 *
 * Exact commands:
 *   npm run youtube:worker:health
 *   npm run youtube:worker -- --verify-only
 *   npm run youtube:worker:prepare-demo
 *   npm run youtube:auth -- --verify
 *   YOUTUBE_WORKER_ALLOW_PROD_JOBS=1 npm run youtube:worker -- --loop
 *   YOUTUBE_WORKER_ALLOW_LIVE=1 YOUTUBE_WORKER_ALLOW_PROD_JOBS=1 npm run youtube:worker -- --once
 *
 * Defaults refuse Production job claiming and live uploads.
 * Intended host: Director's dedicated local machine (not Vercel).
 */

import {
  ensureWorkerFixtures,
  isYoutubeWorkerLiveUploadAllowed,
  isYoutubeWorkerProductionGuardActive,
  prepareRepresentativeFixturePackage,
  reportYoutubeWorkerHealth,
  runYoutubeWorkerOnce,
} from "../lib/youtube/worker/media-worker"
import { inspectYouTubeOAuthReadiness } from "../lib/youtube/recovery/oauth-readiness"

function parseArgs(argv: string[]) {
  return {
    health: argv.includes("--health"),
    verifyOnly: argv.includes("--verify-only"),
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

  if (
    args.health ||
    args.verifyOnly ||
    (!args.prepareDemo && !args.once && !args.loop)
  ) {
    const health = reportYoutubeWorkerHealth(cwd)
    const oauth = inspectYouTubeOAuthReadiness(cwd)
    console.log(
      JSON.stringify(
        {
          event: args.verifyOnly
            ? "youtube-worker-verify-only"
            : "youtube-worker-health",
          ...health,
          oauth: {
            credentialsFilePresent: oauth.credentialsFilePresent,
            tokenFilePresent: oauth.tokenFilePresent,
            clientIdPresent: oauth.clientIdPresent,
            refreshTokenPresent: oauth.refreshTokenPresent,
            scopeHasUpload: oauth.scopeHasUpload,
            accessTokenLooksExpired: oauth.accessTokenLooksExpired,
            // Paths only — never token values.
            credentialsPath: oauth.credentialsPath,
            tokenPath: oauth.tokenPath,
          },
          guards: {
            liveUploadAllowed: isYoutubeWorkerLiveUploadAllowed(),
            productionJobsBlocked: isYoutubeWorkerProductionGuardActive(),
          },
          credentialModel:
            "File-based OAuth only: credentials/youtube-oauth.json + credentials/youtube-token.json (not YOUTUBE_* env vars). Verification: npm run youtube:auth -- --verify",
        },
        null,
        2,
      ),
    )
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
    if (isYoutubeWorkerProductionGuardActive()) {
      console.error(
        JSON.stringify({
          event: "youtube-worker-refused",
          error:
            "Production job claiming is blocked. Set YOUTUBE_WORKER_ALLOW_PROD_JOBS=1 only on the authorised worker host after Director R4-B approval.",
        }),
      )
      process.exit(3)
    }

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
            liveUploadAllowed: isYoutubeWorkerLiveUploadAllowed(),
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
        shutdown: "SIGINT/SIGTERM",
      }),
    )

    let stopping = false
    const stop = () => {
      stopping = true
      console.log(JSON.stringify({ event: "youtube-worker-shutdown" }))
    }
    process.on("SIGINT", stop)
    process.on("SIGTERM", stop)

    while (!stopping) {
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
      if (stopping) break
      await new Promise((r) => setTimeout(r, args.intervalMs))
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
