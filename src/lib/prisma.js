import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global;

let prisma;

try {
  prisma = globalForPrisma.prisma || new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: ['query', 'error', 'warn']
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }
} catch (error) {
  console.error('Failed to initialize Prisma Client:', error);
  // Create a mock client that throws errors
  prisma = {
    $connect: async () => { throw new Error('Database connection failed') },
    $disconnect: async () => {},
    // Add other methods as needed
  };
}

export default prisma;