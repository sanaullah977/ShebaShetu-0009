import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const apt = await prisma.appointment.findFirst({
    include: { queueToken: true }
  });
  console.log(JSON.stringify(apt, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
