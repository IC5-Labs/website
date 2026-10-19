import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pool?: Pool };

function makePool() {
  // The pool connects lazily, so builds without DATABASE_URL still succeed.
  const url = process.env.DATABASE_URL ?? "";
  const needsSsl = /sslmode=require/.test(url) || /neon\.tech|replit/.test(url);
  return new Pool({ connectionString: url || undefined, max: 5, ssl: needsSsl ? { rejectUnauthorized: false } : undefined });
}

export const pool = globalForDb.pool ?? makePool();
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
export { schema };
