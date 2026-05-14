import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Only setup infrastructure (Departments)
  const departments = [
    { name: "Medicine", description: "General medicine and health checkups" },
    { name: "Cardiology", description: "Heart and cardiovascular care" },
    { name: "Pediatrics", description: "Child health and wellness" },
    { name: "Dermatology", description: "Skin and hair care" },
    { name: "Neurology", description: "Brain and nervous system" },
    { name: "Dental", description: "Oral health and surgery" },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }

  console.log("Infrastructure setup complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
