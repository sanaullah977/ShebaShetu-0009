import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    include: { doctorProfile: true },
  });

  console.log("Doctors found:", doctors.length);
  doctors.forEach((d) => {
    console.log(`- ${d.name} (${d.email})`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
