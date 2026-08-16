import { query, genId, shapeWithUser } from "@/lib/db";
import { requireAuth, getUserIdFromRequest } from "@/lib/auth";
import { ok, created, error, unauthorized, rateLimited } from "@/lib/apiResponse";
import { cacheGet, cacheSet } from "@/lib/redis";
import { postCreateLimiter, getClientIdentifier } from "@/lib/rateLimit";
import { withViewerState } from "@/lib/postState";
import { verifyOrigin, forbiddenOrigin } from "@/lib/csrf";
import { LIMITS, validateTitle, validateDescription, validateGithubUrl, sanitizeTechStack, sanitizeContributorsNeeded } from "@/lib/validate";

const FEED_CACHE_TTL = 30; // seconds, per brief
const FEED_PAGE_SIZE = 20;

const VALID_CATEGORIES = ["SHARE", "SELL", "COLLAB", "IDEA"];

const USER_JOIN_SELECT = `
  p.*,
  u.id as "userIdRef",
  u.username as "userUsername",
  u."avatarUrl" as "userAvatarUrl"
`;

export async function GET(request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const cursor = url.searchParams.get("cursor"); // post id to paginate after
  const q = url.searchParams.get("q")?.trim().slice(0, LIMITS.searchQuery);
  const userId = getUserIdFromRequest(request);

  // Search or a specific page can't safely use the "first page" cache.
  const useCache = !cursor && !q;
  const cacheKey = `feed:${category || "all"}:start`;
  let posts, nextCursor;

  const cached = useCache ? await cacheGet(cacheKey) : null;
  if (cached) {
    posts = cached.posts;
    nextCursor = cached.nextCursor;
  } else {
    const conditions = [];
    const params = [];
    let i = 1;

    if (category && VALID_CATEGORIES.includes(category)) {
      conditions.push(`p.category = $${i}::"PostCategory"`);
      params.push(category);
      i += 1;
    }

    if (q) {
      conditions.push(`(p.title ILIKE $${i} OR p.description ILIKE $${i})`);
      params.push(`%${q}%`);
      i += 1;
    }

    if (cursor) {
      const { rows: cRows } = await query(`SELECT "createdAt" FROM "Post" WHERE id = $1`, [cursor]);
      if (cRows[0]) {
        conditions.push(`(p."createdAt", p.id) < ($${i}, $${i + 1})`);
        params.push(cRows[0].createdAt, cursor);
        i += 2;
      }
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await query(
      `SELECT ${USER_JOIN_SELECT}
       FROM "Post" p
       JOIN "User" u ON u.id = p."userId"
       ${where}
       ORDER BY p."createdAt" DESC, p.id DESC
       LIMIT ${FEED_PAGE_SIZE}`,
      params
    );

    posts = rows.map(shapeWithUser);
    nextCursor = posts.length === FEED_PAGE_SIZE ? posts[posts.length - 1].id : null;
    if (useCache) await cacheSet(cacheKey, { posts, nextCursor }, FEED_CACHE_TTL);
  }

  const withState = await withViewerState(posts, userId);
  return ok({ posts: withState, nextCursor });
}

export async function POST(request) {
  if (!verifyOrigin(request)) return forbiddenOrigin();

  const user = await requireAuth(request);
  if (!user) return unauthorized();

  const identifier = getClientIdentifier(request, user.id);
  const { success } = await postCreateLimiter(identifier);
  if (!success) return rateLimited("You can create up to 10 posts per hour");

  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.description || !body?.category) {
    return error("title, description, and category are required", 400);
  }
  if (!VALID_CATEGORIES.includes(body.category)) {
    return error(`category must be one of ${VALID_CATEGORIES.join(", ")}`, 400);
  }

  const titleErr = validateTitle(body.title);
  if (titleErr) return error(titleErr, 400);
  const descErr = validateDescription(body.description);
  if (descErr) return error(descErr, 400);
  const urlErr = validateGithubUrl(body.githubUrl);
  if (urlErr) return error(urlErr, 400);

  const id = genId();
  const techStack = sanitizeTechStack(body.techStack);
  const contributorsNeeded = body.category === "COLLAB" ? sanitizeContributorsNeeded(body.contributorsNeeded) : 0;

  const { rows } = await query(
    `INSERT INTO "Post"
       (id, "userId", title, description, category, "githubUrl", "techStack", "contributorsNeeded", "likesCount", "savedCount", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5::"PostCategory", $6, $7, $8, 0, 0, now(), now())
     RETURNING *`,
    [id, user.id, body.title, body.description, body.category, body.githubUrl || null, techStack, contributorsNeeded]
  );

  const post = { ...rows[0], user: { id: user.id, username: user.username, avatarUrl: user.avatarUrl } };
  return created(post);
}
