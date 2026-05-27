declare module "fluent-ffmpeg" {
  import { EventEmitter } from "events"

  interface FfmpegCommand extends EventEmitter {
    input(source: string | NodeJS.ReadableStream): FfmpegCommand
    seekInput(time: number | string): FfmpegCommand
    frames(frames: number): FfmpegCommand
    setStartTime(time: number | string): FfmpegCommand
    setDuration(duration: number | string): FfmpegCommand
    inputOptions(options: string | string[]): FfmpegCommand
    outputOptions(options: string | string[]): FfmpegCommand
    complexFilter(filters: string | string[]): FfmpegCommand
    screenshots(options: {
      timestamps?: number[]
      timemarks?: Array<number | string>
      filename?: string
      folder?: string
      size?: string
      count?: number
    }): FfmpegCommand
    output(target?: string): FfmpegCommand
    save(output: string): FfmpegCommand
    run(): void
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
