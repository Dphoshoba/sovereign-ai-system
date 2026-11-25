import { NextRequest } from "next/server"
import { GET as publishScheduled, POST as publishScheduledPost } from "../../cron/publish-scheduled/route"

export async function GET(request: NextRequest) {
  return publishScheduled(request)
}

export async function POST(request: NextRequest) {
  return publishScheduledPost(request)
}
