import { Pool } from "pg";
import { randomUUID } from "crypto";

// Raw Postgres access (Neon) via `pg`. Replaces the old Prisma client.
// Table/column names below match what Prisma originally generated
// ("User", "Post", "Like", "Save", "RefreshToken" — PascalCase, quoted)
// so existing data in the deployed Neon database keeps working unchanged.
const globalForDb = globalThis;

export const pool =
  globalForDb.__pcPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pcPool = pool;
}

export async function query(text, params) {
  return pool.query(text, params);
}

/** Runs `fn` inside a BEGIN/COMMIT block, rolling back on error. */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Generates a new primary key id (replaces Prisma's default cuid()). */
export function genId() {
  return randomUUID();
}

/**
 * Turns a flat row that has userIdRef/userUsername/userAvatarUrl(/userBio)
 * columns (from a `JOIN "User" u` with aliased columns) into a row with a
 * nested `user` object, matching the shape Prisma's `include: { user: ... }`
 * used to return.
 */
export function shapeWithUser(row) {
  if (!row) return row;
  const { userIdRef, userUsername, userAvatarUrl, userBio, ...rest } = row;
  return {
    ...rest,
    user: {
      id: userIdRef,
      username: userUsername,
      avatarUrl: userAvatarUrl,
      ...(userBio !== undefined ? { bio: userBio } : {}),
    },
  };
}
