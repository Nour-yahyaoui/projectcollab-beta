import { query, shapeWithUser } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { ok } from "@/lib/apiResponse";
import { withViewerState } from "@/lib/postState";

const USER_POSTS_PAGE_SIZE = 30;
const USER_POSTS_PAGE_SIZE_MAX = 50;

export async function GET(request, { params }) {
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor"); // a post id to paginate after
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit")) || USER_POSTS_PAGE_SIZE, 1),
    USER_POSTS_PAGE_SIZE_MAX
  );

  const conditions = [`p."userId" = $1`];
  const queryParams = [params.id];
  let i = 2;

  if (cursor) {
    const { rows: cRows } = await query(`SELECT "createdAt" FROM "Post" WHERE id = $1`, [cursor]);
    if (cRows[0]) {
      conditions.push(`(p."createdAt", p.id) < ($${i}, $${i + 1})`);
      queryParams.push(cRows[0].createdAt, cursor);
      i += 2;
    }
  }

  const { rows } = await query(
    `SELECT p.*,
            u.id as "userIdRef",
            u.username as "userUsername",
            u."avatarUrl" as "userAvatarUrl"
     FROM "Post" p
     JOIN "User" u ON u.id = p."userId"
     WHERE ${conditions.join(" AND ")}
     ORDER BY p."createdAt" DESC, p.id DESC
     LIMIT ${limit}`,
    queryParams
  );

  const userId = getUserIdFromRequest(request);
  const posts = await withViewerState(rows.map(shapeWithUser), userId);
  const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null;
  return ok({ posts, nextCursor });
}
