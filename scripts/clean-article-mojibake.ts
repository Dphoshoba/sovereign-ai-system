import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { encodingNormalizer } from "../lib/research/encoding-normalizer"
import { contentSafeNormalizer } from "../lib/research/content-safe-normalizer"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

const DRY_RUN = process.argv.includes("--dry")

// Text fields on Article that can hold human-readable content with mojibake.
const TEXT_FIELDS = [
  "title",
  "excerpt",
  "content",
  "seoTitle",
  "seoDescription",
  "seoKeywords",
] as const

type TextField = (typeof TEXT_FIELDS)[number]

async function main() {
  const articles = await prisma.article.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
    },
  })

  let scanned = 0
  let changed = 0
  const changedSlugs: string[] = []

  for (const article of articles) {
    scanned += 1

    // Only ever holds strings: null/empty fields are skipped below, so a
    // recorded change always comes from a non-null original.
    const updates: Partial<Record<TextField, string>> = {}

    for (const field of TEXT_FIELDS) {
      const original = article[field]
      if (original == null) continue

      const cleaned =
        field === "content"
          ? contentSafeNormalizer(original)
          : encodingNormalizer(original)

      if (cleaned !== original) {
        updates[field] = cleaned
      }
    }

    const changedFields = Object.keys(updates)
    if (changedFields.length === 0) continue

    changed += 1
    changedSlugs.push(`${article.slug} [${changedFields.join(", ")}]`)

    if (!DRY_RUN) {
      await prisma.article.update({
        where: { id: article.id },
        data: updates,
      })
    }
  }

  console.log(
    `${DRY_RUN ? "[DRY RUN] " : ""}Scanned ${scanned} article(s); ${
      DRY_RUN ? "would clean" : "cleaned"
    } ${changed}.`
  )

  if (changedSlugs.length > 0) {
    console.log("Affected articles:")
    for (const slug of changedSlugs) {
      console.log(`  - ${slug}`)
    }
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
