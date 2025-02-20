// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Create the 3 counters
  await prisma.counter.upsert({
    where: { code: "CW" },
    update: {},
    create: {
      name: "Customer Welfare",
      code: "CW",
    },
  });

  await prisma.counter.upsert({
    where: { code: "NSA" },
    update: {},
    create: {
      name: "New Service Application",
      code: "NSA",
    },
  });

  await prisma.counter.upsert({
    where: { code: "P" },
    update: {},
    create: {
      name: "Payment",
      code: "P",
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
