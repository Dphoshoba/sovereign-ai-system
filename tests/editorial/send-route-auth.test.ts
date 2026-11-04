import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => {
  const send = vi.fn();
  const mockGetUser = vi.fn();
  const emailFindUnique = vi.fn();
  const emailUpdate = vi.fn();
  const newsletterFindUnique = vi.fn();
  const newsletterUpdate = vi.fn();
  const subscriberFindMany = vi.fn();
  const operationalEventCreate = vi.fn();
  const externalOperationLogCreate = vi.fn();
  return {
    send,
    mockGetUser,
    emailFindUnique,
    emailUpdate,
    newsletterFindUnique,
    newsletterUpdate,
    subscriberFindMany,
    operationalEventCreate,
    externalOperationLogCreate,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: harness.mockGetUser },
  })),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: harness.send };
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailExecution: {
      findUnique: harness.emailFindUnique,
      update: harness.emailUpdate,
    },
    newsletter: {
      findUnique: harness.newsletterFindUnique,
      update: harness.newsletterUpdate,
    },
    subscriber: {
      findMany: harness.subscriberFindMany,
    },
    operationalEvent: {
      create: harness.operationalEventCreate,
    },
    externalOperationLog: {
      create: harness.externalOperationLogCreate,
    },
  },
}));

function editor() {
  return {
    id: "editor-1",
    email: "editor@example.com",
    role: "authenticated",
  };
}

function request(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function postEmail(body: unknown = { emailId: "email-1" }) {
  const { POST } = await import("../../app/api/email-execution/send/route");
  return POST(request("http://localhost/api/email-execution/send", body));
}

async function postNewsletter(body: unknown = { newsletterId: "news-1" }) {
  const { POST } = await import("../../app/api/newsletter/send/route");
  return POST(
    request("http://localhost/api/newsletter/send", body) as never,
  );
}

function expectNoDelivery() {
  expect(harness.send).not.toHaveBeenCalled();
  expect(harness.emailFindUnique).not.toHaveBeenCalled();
  expect(harness.emailUpdate).not.toHaveBeenCalled();
  expect(harness.newsletterFindUnique).not.toHaveBeenCalled();
  expect(harness.newsletterUpdate).not.toHaveBeenCalled();
  expect(harness.subscriberFindMany).not.toHaveBeenCalled();
  expect(harness.operationalEventCreate).not.toHaveBeenCalled();
  expect(harness.externalOperationLogCreate).not.toHaveBeenCalled();
}

describe("newsletter and email send authorisation", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    harness.send.mockReset();
    harness.mockGetUser.mockReset();
    harness.emailFindUnique.mockReset();
    harness.emailUpdate.mockReset();
    harness.newsletterFindUnique.mockReset();
    harness.newsletterUpdate.mockReset();
    harness.subscriberFindMany.mockReset();
    harness.operationalEventCreate.mockReset();
    harness.externalOperationLogCreate.mockReset();
    harness.send.mockResolvedValue({ data: { id: "provider-1" }, error: null });
  });

  it.each([
    ["email", postEmail],
    ["newsletter", postNewsletter],
  ] as const)("rejects an anonymous %s send before reading the identifier", async (_label, post) => {
    harness.mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await post({ emailId: "email-1", newsletterId: "news-1" });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "AUTHENTICATION_REQUIRED",
    });
    expectNoDelivery();
  });

  it.each(["viewer", "reviewer"] as const)(
    "rejects an authenticated %s before reading the identifier",
    async (role) => {
      harness.mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: "user-1",
            email: `${role}@example.com`,
            role,
            app_metadata: { role },
          },
        },
      });

      const email = await postEmail();
      const newsletter = await postNewsletter();

      expect(email.status).toBe(403);
      expect(newsletter.status).toBe(403);
      await expect(email.json()).resolves.toMatchObject({
        ok: false,
        code: "FORBIDDEN",
      });
      await expect(newsletter.json()).resolves.toMatchObject({
        ok: false,
        code: "FORBIDDEN",
      });
      expectNoDelivery();
    },
  );

  it("keeps an unapproved email from being sent", async () => {
    harness.mockGetUser.mockResolvedValue({ data: { user: editor() } });
    harness.emailFindUnique.mockResolvedValue({
      id: "email-1",
      approved: false,
      to: "reader@example.com",
      subject: "Draft",
      body: "Not approved",
    });

    const response = await postEmail();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Email must be approved before sending",
    });
    expect(harness.send).not.toHaveBeenCalled();
    expect(harness.emailUpdate).not.toHaveBeenCalled();
    expect(harness.operationalEventCreate).not.toHaveBeenCalled();
  });

  it("keeps an unapproved newsletter from being sent", async () => {
    harness.mockGetUser.mockResolvedValue({ data: { user: editor() } });
    harness.newsletterFindUnique.mockResolvedValue({
      id: "news-1",
      status: "review-required",
      subject: "Draft",
      previewText: "",
      content: "<p>Draft</p>",
    });

    const response = await postNewsletter();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Newsletter must be approved first",
    });
    expect(harness.send).not.toHaveBeenCalled();
    expect(harness.subscriberFindMany).not.toHaveBeenCalled();
    expect(harness.newsletterUpdate).not.toHaveBeenCalled();
  });

  it("sends an approved email for an authorised editor", async () => {
    harness.mockGetUser.mockResolvedValue({ data: { user: editor() } });
    harness.emailFindUnique.mockResolvedValue({
      id: "email-1",
      approved: true,
      to: "reader@example.com",
      subject: "Approved note",
      body: "Hello",
    });
    harness.emailUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "email-1",
      ...data,
    }));

    const response = await postEmail();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(harness.send).toHaveBeenCalledOnce();
    expect(harness.send.mock.calls[0]?.[0]).toMatchObject({
      to: "reader@example.com",
      subject: "Approved note",
    });
    expect(harness.emailUpdate).toHaveBeenCalled();
    expect(harness.externalOperationLogCreate).toHaveBeenCalledOnce();
    expect(harness.operationalEventCreate).toHaveBeenCalledOnce();
  });

  it("sends an approved newsletter for an authorised editor", async () => {
    harness.mockGetUser.mockResolvedValue({ data: { user: editor() } });
    harness.newsletterFindUnique.mockResolvedValue({
      id: "news-1",
      status: "approved",
      subject: "Approved letter",
      previewText: "Preview",
      content: "<p>Hello</p>",
    });
    harness.subscriberFindMany.mockResolvedValue([
      { email: "reader@example.com", status: "active" },
    ]);
    harness.newsletterUpdate.mockResolvedValue({
      id: "news-1",
      status: "sent",
    });

    const response = await postNewsletter();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, sent: 1 });
    expect(harness.send).toHaveBeenCalledOnce();
    expect(harness.send.mock.calls[0]?.[0]).toMatchObject({
      to: "reader@example.com",
      subject: "Approved letter",
    });
    expect(harness.newsletterUpdate).toHaveBeenCalledOnce();
  });
});
