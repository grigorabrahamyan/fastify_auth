import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // Create sample users
  console.log('👥 Creating sample users...');

  const users = [
    {
      email: 'admin@example.com',
      password: 'adminpassword123',
    },
    {
      email: 'user@example.com',
      password: 'userpassword123',
    },
    {
      email: 'demo@example.com',
      password: 'demopassword123',
    },
  ];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
      },
    });

    console.log(`✅ Created user: ${user.email} (ID: ${user.id})`);
  }

  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📋 Sample users created:');
  console.log('- admin@example.com / adminpassword123');
  console.log('- user@example.com / userpassword123');
  console.log('- demo@example.com / demopassword123');
  console.log('');
  console.log('🚀 You can now test the API with these credentials!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 