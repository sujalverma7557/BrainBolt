import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/brainbolt';

declare global {
  var __db: ReturnType<typeof drizzle> | undefined;
}

function getDb() {
  if (global.__db) return global.__db;
  const pool = new pg.Pool({
    connectionString,
    max: 10,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
   });
  const d = drizzle(pool, { schema });
  global.__db = d;
  return d;
}

export const db = getDb();
export { schema };
