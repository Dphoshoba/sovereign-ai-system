import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const file = searchParams.get("file")

  if (!file) {
    return NextResponse.json(
      { ok: false, error: "file required" },
      { status: 400 }
    )
  }

  const safeFile = path.basename(file)

  const filePath = path.join(
    process.cwd(),
    "public",
    "subtitles",
    safeFile
  )

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { ok: false, error: "Subtitle file not found" },
      { status: 404 }
    )
  }

  const content = fs.readFileSync(filePath, "utf8")

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}