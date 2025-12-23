import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as {
  sql?: postgres.Sql;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  return url;
}

const sql = globalForDb.sql ??
  postgres(getDatabaseUrl(), {
    prepare: false,
    ssl: "require",
    max: 10,
  });
export const db = globalForDb.db ?? drizzle(sql, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.sql = sql;
  globalForDb.db = db;
}
