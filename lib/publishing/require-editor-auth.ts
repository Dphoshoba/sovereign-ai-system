import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const AUTHENTICATION_REQUIRED_BODY = {
  ok: false as const,
  code: "AUTHENTICATION_REQUIRED",
  error: "Authentication required.",
  articleUnchanged: true as const,
};

export async function requireEditorAuth(): Promise<
  { ok: true; actor: string } | { ok: false; response: NextResponse }
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(AUTHENTICATION_REQUIRED_BODY, { status: 401 }),
    };
  }

  return { ok: true, actor: user.email || user.id };
}
