declare module "fluent-ffmpeg" {
  import { EventEmitter } from "events"

  interface FfmpegCommand extends EventEmitter {
    input(source: string | NodeJS.ReadableStream): FfmpegCommand
    setStartTime(time: number | string): FfmpegCommand
    setDuration(duration: number | string): FfmpegCommand
    inputOptions(options: string | string[]): FfmpegCommand
    outputOptions(options: string | string[]): FfmpegCommand
    complexFilter(filters: string | string[]): FfmpegCommand
    save(output: string): FfmpegCommand
    on(event: "end", listener: () => void): FfmpegCommand
    on(event: "error", listener: (err: Error) => void): FfmpegCommand
  }

  interface FfprobeMetadata {
    format: {
      duration?: string | number
    }
  }

  interface FfmpegStatic {
    (source?: string | NodeJS.ReadableStream): FfmpegCommand
    setFfmpegPath(path: string): void
    setFfprobePath(path: string): void
    ffprobe(
      file: string,
      callback: (err: Error | null, metadata: FfprobeMetadata) => void
    ): void
  }

  const ffmpeg: FfmpegStatic
  export default ffmpeg
}
