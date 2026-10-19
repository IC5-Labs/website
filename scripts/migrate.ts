import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const needsSsl = /sslmode=require/.test(url) || /neon\.tech|replit/.test(url);
const pool = new Pool({ connectionString: url, ssl: needsSsl ? { rejectUnauthorized: false } : undefined });
await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
await pool.end();
console.log("Database migrations applied");
