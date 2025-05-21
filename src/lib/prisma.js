import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

let prisma;

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    __internal: {
      usePreparedStatements: false,
    },
  });
}

prisma = globalForPrisma.prisma;

export { prisma };
