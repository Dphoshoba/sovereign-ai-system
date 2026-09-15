import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const articleCreate = vi.fn();
const articleFindMany = vi.fn();
const chatCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      create: (...args: unknown[]) => articleCreate(...args),
      findMany: (...args: unknown[]) => articleFindMany(...args),
    },
  },
}));

vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: vi.fn(() => ({
    chat: { completions: { create: (...args: unknown[]) => chatCreate(...args) } },
  })),
}));

function expectDraftOnlyWrite() {
  expect(articleCreate).toHaveBeenCalledTimes(1);
  const data = articleCreate.mock.calls[0][0].data;
  expect(data.status).toBe("draft");
  expect(data.approvedAt).toBeNull();
  expect(data.approvedBy).toBeNull();
  expect(data.scheduledFor).toBeNull();
  expect(data.publishedAt).toBeNull();
}

describe("draft-only article creation routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    articleCreate.mockImplementation(async ({ data }) => ({ id: "draft-1", ...data }));
    articleFindMany.mockResolvedValue([]);
    chatCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: "Weekly draft",
              excerpt: "Weekly excerpt",
              reasoning: "Coverage gap",
            }),
          },
        },
      ],
    });
  });

  it("planning ignores caller lifecycle fields and creates a draft", async () => {
    const { POST } = await import("../../app/api/planning/create-draft/route");

    const response = await POST(
      new NextRequest("http://localhost/api/planning/create-draft", {
        method: "POST",
        body: JSON.stringify({
          title: "Planned draft",
          category: "ai-tools",
          status: "published",
          publishedAt: "2026-09-16T00:00:00.000Z",
          scheduledFor: "2026-09-20T00:00:00.000Z",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expectDraftOnlyWrite();
  });

  it("weekly planning creates a draft with no lifecycle metadata", async () => {
    const { GET } = await import("../../app/api/workers/weekly-planner/route");

    const response = await GET();

    expect(response.status).toBe(200);
    expectDraftOnlyWrite();
  });
});
