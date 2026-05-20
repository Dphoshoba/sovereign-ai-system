import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const permissions = [
    "articles.read",
    "articles.write",
    "articles.publish",
    "admin.access",
    "roles.manage",
  ]

  for (const key of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, description: key },
    })
  }

  const adminRole = await prisma.role.upsert({
    where: { key: "admin" },
    update: {},
    create: {
      key: "admin",
      name: "Admin",
      description: "Full platform administrator",
    },
  })

  const allPermissions = await prisma.permission.findMany()

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    })
  }

  console.log("Seed completed")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })