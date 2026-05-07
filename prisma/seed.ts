import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  // 1. Create Departments
  const medicine = await prisma.department.upsert({
    where: { name: "Medicine" },
    update: {},
    create: {
      name: "Medicine",
      description: "General medicine and health checkups",
    },
  });

  const cardiology = await prisma.department.upsert({
    where: { name: "Cardiology" },
    update: {},
    create: {
      name: "Cardiology",
      description: "Heart and cardiovascular care",
    },
  });

  // 2. Create Doctors
  await prisma.user.upsert({
    where: { email: "dr.anika@example.com" },
    update: {},
    create: {
      name: "Dr. Anika Rahman",
      email: "dr.anika@example.com",
      passwordHash,
      role: "DOCTOR",
      doctorProfile: {
        create: {
          specialization: "General Medicine",
          departmentIds: [medicine.id],
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "dr.tanvir@example.com" },
    update: {},
    create: {
      name: "Dr. Tanvir Hossain",
      email: "dr.tanvir@example.com",
      passwordHash,
      role: "DOCTOR",
      doctorProfile: {
        create: {
          specialization: "Cardiology",
          departmentIds: [cardiology.id],
        },
      },
    },
  });

  // 3. Create a Demo Patient
  await prisma.user.upsert({
    where: { email: "nadia@example.com" },
    update: {},
    create: {
      name: "Nadia Ahmed",
      email: "nadia@example.com",
      passwordHash,
      role: "PATIENT",
      patientProfile: {
        create: {
          bloodGroup: "O+",
        },
      },
    },
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
