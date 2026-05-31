const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.socialPost.findMany({
    take: 5
  });

  console.log(JSON.stringify(posts, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
