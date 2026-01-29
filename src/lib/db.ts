import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const prismaClientSingleton = () => {
  // Use SSL only for remote connections (production Supabase)
  const isLocalhost = connectionString.includes('127.0.0.1') || connectionString.includes('localhost');

  const pool = new Pool({
    connectionString,
    // Match Prisma v6 timeout behavior
    connectionTimeoutMillis: 5000,
    // SSL required for remote Supabase, disabled for local
    ssl: isLocalhost ? false : { rejectUnauthorized: false },
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const db = globalThis.prismaGlobal ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = db;
}
