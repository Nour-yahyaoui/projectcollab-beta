import jwt from "jsonwebtoken";
import crypto from "crypto";
import { query, genId } from "./db";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_DAYS = 30;
const COOKIE_NAME = "pc_session";

function requireSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export function signAccessToken(userId) {
  return jwt.sign({ sub: userId, type: "access" }, requireSecret(), {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

function randomRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a new refresh token, stores its hash in the DB (so it can be
 * revoked per-device), and returns the raw token to send to the client.
 */
export async function issueRefreshToken(userId, device = "web") {
  const raw = randomRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  const id = genId();
  await query(
    `INSERT INTO "RefreshToken" (id, "userId", "tokenHash", device, "expiresAt", revoked, "createdAt")
     VALUES ($1, $2, $3, $4, $5, false, now())`,
    [id, userId, hashToken(raw), device, expiresAt]
  );
  return raw;
}

export async function rotateRefreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const { rows } = await query(`SELECT * FROM "RefreshToken" WHERE "tokenHash" = $1`, [tokenHash]);
  const record = rows[0];
  if (!record || record.revoked || new Date(record.expiresAt) < new Date()) {
    return null;
  }
  // revoke old, issue new (rotation limits damage from a leaked token)
  await query(`UPDATE "RefreshToken" SET revoked = true WHERE "tokenHash" = $1`, [tokenHash]);
  const newRaw = await issueRefreshToken(record.userId, record.device);
  return { userId: record.userId, refreshToken: newRaw };
}

export async function revokeRefreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  await query(`UPDATE "RefreshToken" SET revoked = true WHERE "tokenHash" = $1`, [tokenHash]);
}

function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, requireSecret());
    if (payload.type !== "access") return null;
    return payload.sub;
  } catch {
    return null;
  }
}

/**
 * Resolves the authenticated user id from either:
 *  - `Authorization: Bearer <token>` header — used by React Native / Flutter
 *  - `pc_session` httpOnly cookie — used by the web app
 */
export function getUserIdFromRequest(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return verifyAccessToken(authHeader.slice(7));
  }
  const cookieToken = request.cookies?.get(COOKIE_NAME)?.value;
  if (cookieToken) {
    return verifyAccessToken(cookieToken);
  }
  return null;
}

export async function requireAuth(request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return null;
  const { rows } = await query(`SELECT * FROM "User" WHERE id = $1`, [userId]);
  return rows[0] || null;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const REFRESH_TOKEN_TTL_SECONDS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60;
