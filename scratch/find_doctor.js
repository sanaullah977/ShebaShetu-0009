const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findDoctor() {
  const doctor = await prisma.user.findFirst({
    where: { role: 'DOCTOR' }
  });
  console.log(JSON.stringify(doctor));
  await prisma.$disconnect();
}

findDoctor();
