import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

// In-memory fallback so local dev without Upstash configured still works
// (limits reset per cold start, which is fine for local testing only).
const memoryStore = new Map();

function memoryLimiter(limit, windowMs) {
  return async (identifier) => {
    const now = Date.now();
    const entry = memoryStore.get(identifier);
    if (!entry || now - entry.start > windowMs) {
      memoryStore.set(identifier, { start: now, count: 1 });
      return { success: true, remaining: limit - 1 };
    }
    if (entry.count >= limit) {
      return { success: false, remaining: 0 };
    }
    entry.count += 1;
    return { success: true, remaining: limit - entry.count };
  };
}

const limiters = {};

function getLimiter(name, limit, window) {
  if (limiters[name]) return limiters[name];

  const redis = getRedis();
  if (redis) {
    const rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `ratelimit:${name}`,
    });
    limiters[name] = async (identifier) => {
      const { success, remaining } = await rl.limit(identifier);
      return { success, remaining };
    };
  } else {
    limiters[name] = memoryLimiter(limit, parseWindowToMs(window));
  }
  return limiters[name];
}

function parseWindowToMs(window) {
  // supports "1 h", "1 m" style Upstash windows
  const [n, unit] = window.split(" ");
  const num = parseInt(n, 10);
  if (unit.startsWith("s")) return num * 1000;
  if (unit.startsWith("m")) return num * 60 * 1000;
  if (unit.startsWith("h")) return num * 60 * 60 * 1000;
  return num * 1000;
}

// Preconfigured limiters matching the MVP brief
export const aiLimiter = (identifier) => getLimiter("ai", 20, "1 h")(identifier);
export const postCreateLimiter = (identifier) => getLimiter("post-create", 10, "1 h")(identifier);
export const authLimiter = (identifier) => getLimiter("auth", 5, "1 m")(identifier);
export const messageAiLimiter = (identifier) => getLimiter("message-ai", 20, "1 h")(identifier);
export const messageSendLimiter = (identifier) => getLimiter("message-send", 60, "1 h")(identifier);

export function getClientIdentifier(request, userId) {
  if (userId) return `user:${userId}`;
  const forwarded = request.headers.get("x-forwarded-for");
  return `ip:${forwarded?.split(",")[0]?.trim() ?? "unknown"}`;
}
