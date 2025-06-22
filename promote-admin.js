const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  rl.question('Enter the email of the user to make admin: ', async (email) => {
    if (!email) {
      console.log('Email cannot be empty.');
      rl.close();
      return;
    }

    try {
      const user = await prisma.user.update({
        where: { email: email },
        data: { role: 'ADMIN' },
      });
      console.log(`Successfully promoted ${user.name} (${user.email}) to ADMIN.`);
    } catch (error) {
      if (error.code === 'P2025') {
        console.error(`Error: User with email "${email}" not found.`);
      } else {
        console.error('An error occurred:', error);
      }
    } finally {
      await prisma.$disconnect();
      rl.close();
    }
  });
}

main(); 