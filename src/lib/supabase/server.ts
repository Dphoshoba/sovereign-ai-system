import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Intentionally empty for Server Components.
          // Cookie writes must happen in Route Handlers, Server Actions, or Middleware.
        },
      },
    }
  )
}