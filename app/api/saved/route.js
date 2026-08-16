import { query, shapeWithUser } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/apiResponse";
import { withViewerState } from "@/lib/postState";

export async function GET(request) {
  const user = await requireAuth(request);
  if (!user) return unauthorized();

  const { rows } = await query(
    `SELECT p.*,
            u.id as "userIdRef",
            u.username as "userUsername",
            u."avatarUrl" as "userAvatarUrl"
     FROM "Save" s
     JOIN "Post" p ON p.id = s."postId"
     JOIN "User" u ON u.id = p."userId"
     WHERE s."userId" = $1
     ORDER BY s."createdAt" DESC`,
    [user.id]
  );

  const posts = await withViewerState(rows.map(shapeWithUser), user.id);
  return ok({ posts });
}
