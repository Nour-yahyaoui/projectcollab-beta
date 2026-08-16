import { Redis } from "@upstash/redis";

// Upstash works over HTTP, which is what makes it usable from serverless
// functions (no persistent TCP connection needed, unlike traditional Redis).
// If not configured, we fall back to a no-op stub so the app still runs
// locally without a Redis instance (rate limiting / caching just no-op).
let redis = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export function getRedis() {
  return redis;
}

export async function cacheGet(key) {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds) {
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    /* cache failures should never break the request */
  }
}

export async function cacheDel(keyOrPrefix) {
  if (!redis) return;
  try {
    await redis.del(keyOrPrefix);
  } catch {
    /* ignore */
  }
}
