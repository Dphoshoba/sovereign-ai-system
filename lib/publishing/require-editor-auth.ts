import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authorizeCronRequest } from "./cron-auth";
import { canPublishAsEditor } from "./editor-access";

export { canPublishAsEditor };

export const EDITOR_FORBIDDEN_BODY = {
  ok: false as const,
  code: "FORBIDDEN",
  error: "Authenticated account is not authorised.",
  articleUnchanged: true as const,
};

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

  if (!canPublishAsEditor(user)) {
    return {
      ok: false,
      response: NextResponse.json(EDITOR_FORBIDDEN_BODY, { status: 403 }),
    };
  }

  return { ok: true, actor: user.email || user.id };
}

export const PUBLISHING_FORBIDDEN_BODY = {
  ok: false as const,
  code: "FORBIDDEN",
  error: "Authenticated account is not authorised to publish.",
  articleUnchanged: true as const,
};

export async function requirePublishingEditor(): Promise<
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

  if (!canPublishAsEditor(user)) {
    return {
      ok: false,
      response: NextResponse.json(PUBLISHING_FORBIDDEN_BODY, { status: 403 }),
    };
  }

  return { ok: true, actor: user.email || user.id };
}

export function editorSessionHeaders(request: Request) {
  const headers = new Headers();
  const raw = request.headers.get("cookie");
  if (!raw) return headers;

  const session = raw
    .split(";")
    .map((part) => part.trim())
    .filter((part) => {
      const name = part.split("=")[0] ?? "";
      return name.startsWith("sb-") && name.includes("auth-token");
    });

  if (session.length > 0) headers.set("cookie", session.join("; "));
  return headers;
}

export function privilegedSameOriginHeaders(request: Request) {
  const headers = new Headers({ "content-type": "application/json" });
  if (authorizeCronRequest(request).ok) {
    const authorization = request.headers.get("authorization");
    if (authorization) headers.set("authorization", authorization);
    return headers;
  }

  const cookie = editorSessionHeaders(request).get("cookie");
  if (cookie) headers.set("cookie", cookie);
  return headers;
}

export async function authorizeEditorOrCron(request: Request) {
  if (authorizeCronRequest(request).ok) {
    return { ok: true as const, via: "cron" as const };
  }

  const editor = await requireEditorAuth();
  if (editor.ok) {
    return { ok: true as const, via: "editor" as const, actor: editor.actor };
  }

  return editor;
}
