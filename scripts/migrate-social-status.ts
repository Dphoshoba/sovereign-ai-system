import { prisma } from "../lib/prisma"

async function main() {
  const result = await prisma.socialPost.updateMany({
    where: {
      status: "draft",
    },
    data: {
      status: "review-required",
    },
  })

  console.log(
    `Updated ${result.count} social posts to review-required`
  )
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
