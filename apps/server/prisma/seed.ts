import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmails = (process.env.ADMIN_EMAILS || 'admin@empresa.com')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  for (const email of adminEmails) {
    await prisma.user.upsert({
      where: { email },
      update: { role: Role.ADMIN, isActive: true },
      create: { email, name: email.split('@')[0], role: Role.ADMIN }
    });
  }

  await prisma.ticketSequence.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, value: 0 }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
