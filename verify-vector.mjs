import { PrismaClient } from './src/generated/prisma/client.js'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.$queryRaw`
    SELECT extname
    FROM pg_extension
    WHERE extname = 'vector'
  `

  console.log(result)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })