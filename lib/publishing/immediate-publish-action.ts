export const IMMEDIATE_PUBLISH_ENDPOINT = "/api/articles/publish-package";

export const IMMEDIATE_PUBLISH_CONFIRM =
  "This will publish the article immediately to the public site. Continue?";

export type ImmediatePublishSubmitResult =
  | { ok: true }
  | { ok: false; error: string | null; skipped: boolean };

export async function submitImmediatePublishPackage(input: {
  articleId: string;
  fetchImpl?: typeof fetch;
  confirmImpl?: () => boolean;
  inFlight: { current: boolean };
}): Promise<ImmediatePublishSubmitResult> {
  if (input.inFlight.current) {
    return { ok: false, error: null, skipped: true };
  }

  if (input.confirmImpl && !input.confirmImpl()) {
    return { ok: false, error: null, skipped: true };
  }

  input.inFlight.current = true;

  try {
    const fetchFn = input.fetchImpl ?? fetch;
    const response = await fetchFn(IMMEDIATE_PUBLISH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId: input.articleId }),
    });
    const result = (await response.json()) as {
      ok?: boolean;
      error?: string;
    };

    if (!response.ok || result.ok === false) {
      return {
        ok: false,
        skipped: false,
        error: result.error || "Publication failed.",
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      error:
        error instanceof Error ? error.message : "Publication failed.",
    };
  } finally {
    input.inFlight.current = false;
  }
}
