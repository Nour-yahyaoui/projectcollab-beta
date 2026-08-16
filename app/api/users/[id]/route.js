import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, error, notFound, unauthorized } from "@/lib/apiResponse";
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";
import { verifyOrigin, forbiddenOrigin } from "@/lib/csrf";
import { validateBio, sanitizeTechStack } from "@/lib/validate";

const PROFILE_CACHE_TTL = 5 * 60; // 5 minutes, per brief

export async function GET(request, { params }) {
  const cacheKey = `profile:${params.id}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return ok(cached);

  const { rows } = await query(
    `SELECT u.id, u.username, u."avatarUrl", u.bio, u."techStack", u."createdAt",
            (SELECT COUNT(*)::int FROM "Post" p WHERE p."userId" = u.id) as "postsCount"
     FROM "User" u
     WHERE u.id = $1`,
    [params.id]
  );
  const row = rows[0];
  if (!row) return notFound("User not found");

  const { postsCount, ...rest } = row;
  const user = { ...rest, _count: { posts: postsCount } };

  await cacheSet(cacheKey, user, PROFILE_CACHE_TTL);
  return ok(user);
}

export async function PUT(request, { params }) {
  if (!verifyOrigin(request)) return forbiddenOrigin();

  const user = await requireAuth(request);
  if (!user) return unauthorized();
  if (user.id !== params.id) return error("You can only edit your own profile", 403);

  const body = await request.json().catch(() => null);
  if (!body) return error("Invalid request body", 400);

  const bio = body.bio ?? user.bio;
  const bioErr = validateBio(bio);
  if (bioErr) return error(bioErr, 400);
  const techStack = body.techStack !== undefined ? sanitizeTechStack(body.techStack) : user.techStack;

  const { rows } = await query(
    `UPDATE "User" SET bio = $1, "techStack" = $2, "updatedAt" = now() WHERE id = $3 RETURNING *`,
    [bio, techStack, params.id]
  );

  await cacheDel(`profile:${params.id}`);
  return ok(rows[0]);
}
