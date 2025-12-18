import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

let prismaWriteInstance: PrismaClient | null = null;
let prismaReadInstance: PrismaClient | null = null;

const resolveSslConfig = () => {
  const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;

  if (rejectUnauthorized === undefined) {
    return undefined;
  }

  return {
    rejectUnauthorized: rejectUnauthorized !== 'false' && rejectUnauthorized !== '0',
  };
};

const createClient = (connectionString: string): PrismaClient => {
  const adapter = new PrismaPg({
    connectionString,
    ssl: resolveSslConfig(),
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

export const getPrismaWriteClient = (): PrismaClient => {
  if (!prismaWriteInstance) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }

    prismaWriteInstance = createClient(databaseUrl);
  }
  return prismaWriteInstance;
};

export const getPrismaReadClient = (): PrismaClient => {
  if (!prismaReadInstance) {
    const databaseReadUrl = process.env.DATABASE_READ_URL || process.env.DATABASE_URL;

    if (!databaseReadUrl) {
      throw new Error('DATABASE_READ_URL or DATABASE_URL must be set');
    }

    prismaReadInstance = createClient(databaseReadUrl);
  }
  return prismaReadInstance;
};

export const disconnectPrisma = async (): Promise<void> => {
  if (prismaWriteInstance) {
    await prismaWriteInstance.$disconnect();
  }
  if (prismaReadInstance && prismaReadInstance !== prismaWriteInstance) {
    await prismaReadInstance.$disconnect();
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await disconnectPrisma();
});
