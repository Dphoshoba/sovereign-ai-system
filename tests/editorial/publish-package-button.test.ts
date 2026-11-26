import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PublishPackageForm } from "../../app/admin/articles/PublishPackageButton";
import {
  IMMEDIATE_PUBLISH_CONFIRM,
  IMMEDIATE_PUBLISH_ENDPOINT,
  submitImmediatePublishPackage,
} from "../../lib/publishing/immediate-publish-action";

describe("immediate Publish Package control", () => {
  it("labels the action and warns that publication is immediate", () => {
    const html = renderToStaticMarkup(
      createElement(PublishPackageForm, {
        submitting: false,
        error: "",
        onPublish: vi.fn(),
      }),
    );

    expect(html).toContain("Publish Package");
    expect(html).toContain("Publication is immediate");
    expect(html).not.toContain("disabled=\"\"");
    expect(IMMEDIATE_PUBLISH_CONFIRM).toContain("immediately");
  });

  it("disables the control while submitting and surfaces the API error", () => {
    const html = renderToStaticMarkup(
      createElement(PublishPackageForm, {
        submitting: true,
        error: "Article requires human review before publishing.",
        onPublish: vi.fn(),
      }),
    );

    expect(html).toContain("Publishing...");
    expect(html).toContain("disabled=\"\"");
    expect(html).toContain("Article requires human review before publishing.");
    expect(html).toContain("role=\"alert\"");
  });

  it("posts only the article ID to the official publish-package endpoint", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe(IMMEDIATE_PUBLISH_ENDPOINT);
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify({ articleId: "article-1" }));
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const inFlight = { current: false };

    const result = await submitImmediatePublishPackage({
      articleId: "article-1",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      inFlight,
    });

    expect(result).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(inFlight.current).toBe(false);
  });

  it("prevents a second submission while the first request is in flight", async () => {
    let release!: (value: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      release = resolve;
    });
    const fetchImpl = vi.fn(() => pending);
    const inFlight = { current: false };

    const first = submitImmediatePublishPackage({
      articleId: "article-1",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      inFlight,
    });
    const second = await submitImmediatePublishPackage({
      articleId: "article-1",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      inFlight,
    });

    expect(second).toEqual({ ok: false, error: null, skipped: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    release(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    await expect(first).resolves.toEqual({ ok: true });
    expect(inFlight.current).toBe(false);
  });

  it("surfaces the backend error and does not treat a cancelled confirm as a request", async () => {
    const fetchImpl = vi.fn();
    const declined = await submitImmediatePublishPackage({
      articleId: "article-1",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      confirmImpl: () => false,
      inFlight: { current: false },
    });
    expect(declined).toEqual({ ok: false, error: null, skipped: true });
    expect(fetchImpl).not.toHaveBeenCalled();

    const failed = await submitImmediatePublishPackage({
      articleId: "article-1",
      fetchImpl: vi.fn(async () =>
        new Response(
          JSON.stringify({
            ok: false,
            error: "Article requires a current research audit matching this content revision before publishing.",
          }),
          { status: 409 },
        ),
      ) as unknown as typeof fetch,
      inFlight: { current: false },
    });
    expect(failed).toEqual({
      ok: false,
      skipped: false,
      error:
        "Article requires a current research audit matching this content revision before publishing.",
    });
  });
});
