import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

let prisma;

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: ['query'], // optional: logs SQL queries
  });
}

prisma = globalForPrisma.prisma;

export { prisma };
