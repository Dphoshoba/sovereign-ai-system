import { prisma } from "@/lib/prisma"

export async function getMemoryContext({
  query = "",
  types = [],
  limit = 8,
}: {
  query?: string
  types?: string[]
  limit?: number
}) {
  const memories = await prisma.aiMemory.findMany({
    where: {
      ...(types.length > 0
        ? {
            type: {
              in: types,
            },
          }
        : {}),
      ...(query
        ? {
            OR: [
              {
                title: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                content: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                tags: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  })

  if (memories.length === 0) {
    return "No saved AI memories found."
  }

  return memories
    .map((memory) => {
      return `
Memory Type: ${memory.type}
Title: ${memory.title}
Tags: ${memory.tags || "none"}
Content:
${memory.content}
`
    })
    .join("\n---\n")
}