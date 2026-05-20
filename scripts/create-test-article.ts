import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const article = await prisma.article.create({
    data: {
      title: "The Future of AI Automation for Creators",
      slug: "future-of-ai-automation-for-creators",
      category: "ai-automation",
      status: "draft",
      excerpt:
        "How creators, ministries, founders, and agencies can leverage AI automation systems to scale intelligently.",
    },
  })

  console.log(article)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })