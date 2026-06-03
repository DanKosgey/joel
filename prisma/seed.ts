import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱  Starting database seed...\n');

  // ─── admin@aurumxau.com / Admin1234! ──────────────────────────────
  const adminEmail = 'admin@g.com';
  const adminPasswordHash = await bcrypt.hash('admin', SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      name: 'AurumXAU Admin',
      role: 'ADMIN',
      kycStatus: 'APPROVED',
    },
  });

  console.log(`✅  Admin created:    ${admin.email}`);

  // ─── client1@aurumxau.com / Client1234! ───────────────────────────
  const client1Email = 'client1@g.com';
  const client1Hash = await bcrypt.hash('client1', SALT_ROUNDS);

  const client1 = await prisma.user.upsert({
    where: { email: client1Email },
    update: { passwordHash: client1Hash },
    create: {
      email: client1Email,
      passwordHash: client1Hash,
      name: 'Client One',
      role: 'CLIENT',
      kycStatus: 'APPROVED',
      mt5Accounts: {
        create: {
          brokerName: 'Exness',
          accountNumber: '12345678',
          serverName: 'Exness-MT5Real3',
          isVerified: true,
        },
      },
    },
  });

  console.log(`✅  Client 1 created: ${client1.email}`);

  // ─── client2@aurumxau.com / Client1234! ───────────────────────────
  const client2Email = 'client2@g.com';
  const client2Hash = await bcrypt.hash('client2', SALT_ROUNDS);

  const client2 = await prisma.user.upsert({
    where: { email: client2Email },
    update: { passwordHash: client2Hash },
    create: {
      email: client2Email,
      passwordHash: client2Hash,
      name: 'Client Two',
      role: 'CLIENT',
      kycStatus: 'PENDING',
    },
  });

  console.log(`✅  Client 2 created: ${client2.email}`);

  // ─── Seed Signal (adminId) ──────────────────────────────────────
  await prisma.signal.create({
    data: {
      adminId: admin.id,
      instrument: 'XAUUSD',
      direction: 'BUY',
      entryPrice: 2318.40,
      stopLoss: 2305.00,
      takeProfit: 2345.00,
      status: 'ACTIVE',
    },
  });

  console.log('\n🎉  Seed complete.\n');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
