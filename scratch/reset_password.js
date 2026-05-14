const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetPassword() {
  const passwordHash = await bcrypt.hash('password123', 10);
  await prisma.user.update({
    where: { email: 'dr.anika@example.com' },
    data: { passwordHash }
  });
  console.log('Password reset successfully');
  await prisma.$disconnect();
}

resetPassword();
