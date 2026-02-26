import "server-only";
import { Pool } from "pg";
import type { QueryResultRow } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

declare global {
  var _pgPool: Pool | undefined;
}

export const pool =
  globalThis._pgPool ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis._pgPool = pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: ReadonlyArray<unknown>
) {
  return pool.query<T>(text, params);
}
