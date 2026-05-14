import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const receptionists = await prisma.user.findMany({
    where: { role: "RECEPTION" },
    include: { receptionProfile: true },
  });

  console.log("Receptionists found:", receptionists.length);
  receptionists.forEach((r) => {
    console.log(`- ${r.name} (${r.email})`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
