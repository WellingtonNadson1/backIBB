// prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const createPrismaInstance = () => {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  return global.prisma;
};

const disconnectPrisma = async () => {
  if (global.prisma) {
    await global.prisma.$disconnect();
  }
};

export { createPrismaInstance, disconnectPrisma };
