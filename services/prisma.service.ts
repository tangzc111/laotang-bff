import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

let prismaServiceInstance: PrismaClient | null = null;

export const getPrismaInstance = (): PrismaClient => {
  if (!prismaServiceInstance) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }

    const adapter = new PrismaPg({ connectionString: databaseUrl });

    prismaServiceInstance = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prismaServiceInstance;
};

export const disconnectPrisma = async (): Promise<void> => {
  if (prismaServiceInstance) {
    await prismaServiceInstance.$disconnect();
  }
};

// Export singleton instance for Awilix
export const createPrismaClient = (): PrismaClient => {
  return getPrismaInstance();
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await disconnectPrisma();
});
