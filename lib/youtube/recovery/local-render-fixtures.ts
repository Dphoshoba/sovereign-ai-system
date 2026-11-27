/**
 * Fixture render helpers for isolated R1 validation.
 * Uses system/ffmpeg-static only — no OpenAI / paid generation.
 */

import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"

function resolveFfmpegBinary(cwd: string): string {
  const staticWin = path.join(cwd, "node_modules", "ffmpeg-static", "ffmpeg.exe")
  const staticUnix = path.join(cwd, "node_modules", "ffmpeg-static", "ffmpeg")
  if (process.platform === "win32" && fs.existsSync(staticWin)) return staticWin
  if (fs.existsSync(staticUnix)) return staticUnix
  return "ffmpeg"
}

export function runFfmpeg(args: string[], cwd: string = process.cwd()) {
  const bin = resolveFfmpegBinary(cwd)
  const result = spawnSync(bin, args, {
    cwd,
    encoding: "utf8",
  })
  if (result.status !== 0) {
    throw new Error(
      `ffmpeg failed (${result.status}): ${result.stderr || result.stdout}`,
    )
  }
  return result
}

export function ensureR1FixtureDir(cwd: string = process.cwd()) {
  const dir = path.join(cwd, "public", "r1-fixtures")
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

/** Create a 2s tone + solid-colour video for sync/render smoke tests. */
export function createMinimalAvFixtures(cwd: string = process.cwd()) {
  const dir = ensureR1FixtureDir(cwd)
  const audioPath = path.join(dir, "tone-2s.mp3")
  const videoPath = path.join(dir, "colour-2s.mp4")
  const verticalPath = path.join(dir, "vertical-2s.mp4")
  const subtitlePath = path.join(dir, "tone-2s.srt")
  const subtitledPath = path.join(dir, "colour-2s-subs.mp4")
  const thumbPath = path.join(dir, "thumbnail-1280x720.jpg")

  runFfmpeg(
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:duration=2",
      "-q:a",
      "9",
      audioPath,
    ],
    cwd,
  )

  runFfmpeg(
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=0x1a3344:s=1280x720:d=2",
      "-i",
      audioPath,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-shortest",
      videoPath,
    ],
    cwd,
  )

  runFfmpeg(
    [
      "-y",
      "-i",
      videoPath,
      "-vf",
      "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,setsar=1",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "copy",
      verticalPath,
    ],
    cwd,
  )

  fs.writeFileSync(
    subtitlePath,
    `1
00:00:00,000 --> 00:00:01,500
R1 recovery fixture

2
00:00:01,500 --> 00:00:02,000
Audio/video sync check
`,
    "utf8",
  )

  // Escape path for subtitles filter on Windows
  const escapedSubs = subtitlePath.replace(/\\/g, "/").replace(/:/g, "\\:")
  runFfmpeg(
    [
      "-y",
      "-i",
      videoPath,
      "-vf",
      `subtitles='${escapedSubs}'`,
      "-c:a",
      "copy",
      subtitledPath,
    ],
    cwd,
  )

  return {
    dir,
    audioPath,
    videoPath,
    verticalPath,
    subtitlePath,
    subtitledPath,
    thumbPath,
  }
}

export async function createFixtureThumbnail(
  outputPath: string,
  title: string,
) {
  const svg = `
    <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="720" fill="#102033"/>
      <rect x="48" y="48" width="1184" height="624" fill="none" stroke="#c9a227" stroke-width="8"/>
      <text x="640" y="360" fill="#f5f0e6" font-size="64" font-family="Arial" text-anchor="middle">${title
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .slice(0, 42)}</text>
    </svg>
  `
  await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toFile(outputPath)
  return outputPath
}

export function probeMediaDurationSeconds(
  filePath: string,
  cwd: string = process.cwd(),
): number {
  const ffprobeStatic = path.join(
    cwd,
    "node_modules",
    "ffprobe-static",
    "bin",
    process.platform === "win32" ? "win32" : process.platform,
    "x64",
    process.platform === "win32" ? "ffprobe.exe" : "ffprobe",
  )
  const bin = fs.existsSync(ffprobeStatic) ? ffprobeStatic : "ffprobe"
  const result = spawnSync(
    bin,
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ],
    { encoding: "utf8" },
  )
  if (result.status !== 0) {
    throw new Error(`ffprobe failed: ${result.stderr || result.stdout}`)
  }
  return Number(String(result.stdout).trim()) || 0
}
