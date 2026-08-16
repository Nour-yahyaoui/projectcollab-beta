import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, error, unauthorized } from "@/lib/apiResponse";
import { verifyOrigin, forbiddenOrigin } from "@/lib/csrf";

/** Returns the current user's recent notifications and unread count. */
export async function GET(request) {
  const user = await requireAuth(request);
  if (!user) return unauthorized();

  const { rows } = await query(
    `SELECT n.id, n.type, n.message, n.read, n.created_at as "createdAt",
            n.conversation_id as "conversationId", n.post_id as "postId",
            fu.id as "fromUserId", fu.username as "fromUsername", fu."avatarUrl" as "fromAvatarUrl",
            p.title as "postTitle"
     FROM notifications n
     LEFT JOIN "User" fu ON fu.id = n.from_user_id
     LEFT JOIN "Post" p ON p.id = n.post_id
     WHERE n.user_id = $1
     ORDER BY n.created_at DESC
     LIMIT 30`,
    [user.id]
  );

  const notifications = rows.map((r) => ({
    id: r.id,
    type: r.type,
    message: r.message,
    read: r.read,
    createdAt: r.createdAt,
    conversationId: r.conversationId,
    postId: r.postId,
    postTitle: r.postTitle,
    fromUser: r.fromUserId ? { id: r.fromUserId, username: r.fromUsername, avatarUrl: r.fromAvatarUrl } : null,
  }));

  const unreadCount = notifications.filter((n) => !n.read).length;
  return ok({ notifications, unreadCount });
}

/** Marks one notification read (`{ id }`) or all of them (`{ all: true }`). */
export async function POST(request) {
  if (!verifyOrigin(request)) return forbiddenOrigin();

  const user = await requireAuth(request);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (body?.all) {
    await query(`UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`, [user.id]);
    return ok({ success: true });
  }
  if (body?.id) {
    await query(`UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`, [body.id, user.id]);
    return ok({ success: true });
  }
  return error("id or all is required", 400);
}
