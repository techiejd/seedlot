import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const admin = await prisma.role.create({
    data: {
      name: "admin",
    },
  });
  const manager = await prisma.role.create({
    data: {
      name: "manager",
    },
  });
  const investor = await prisma.role.create({
    data: {
      name: "investor",
    },
  });
  console.log({ admin, manager, investor });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
