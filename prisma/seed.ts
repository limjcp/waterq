import { PrismaClient, Role } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1. Upsert Services
  const servicesData = [
    { code: "CW", name: "Customer Welfare" },
    { code: "NSA", name: "New Service Application" },
    { code: "P", name: "Payment" },
  ];

  const services = await Promise.all(
    servicesData.map((service) =>
      prisma.service.upsert({
        where: { code: service.code },
        update: {},
        create: { ...service },
      })
    )
  );

  // Create a lookup map for services by code.
  const serviceMap = services.reduce<Record<string, (typeof services)[number]>>(
    (acc, service) => {
      acc[service.code] = service;
      return acc;
    },
    {}
  );

  // 2. Upsert Counters and link them to the respective service.
  const countersData = [
    { code: "CW", name: "Customer Welfare Counter", serviceCode: "CW" },
    {
      code: "NSA",
      name: "New Service Application Counter",
      serviceCode: "NSA",
    },
    { code: "P", name: "Payment Counter", serviceCode: "P" },
  ];

  const counters = await Promise.all(
    countersData.map((counter) =>
      prisma.counter.upsert({
        where: { code: counter.code },
        update: {},
        create: {
          name: counter.name,
          code: counter.code,
          service: { connect: { id: serviceMap[counter.serviceCode].id } },
        },
      })
    )
  );

  // 3. Create a sample staff user and assign a counter.
  await prisma.user.upsert({
    where: { email: "staff@example.com" },
    update: {},
    create: {
      firstName: "Staff",
      lastName: "Member",
      email: "staff@example.com",
      password: "password", // In production, always store a hashed password
      username: "staff1",
      role: { set: ["staff"] },
      assignedCounter: { connect: { id: counters[0].id } },
    },
  });

  console.log("Database has been seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
