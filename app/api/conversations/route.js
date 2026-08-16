import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, error, unauthorized, notFound, rateLimited } from "@/lib/apiResponse";
import { findOrCreateConversation, sendMessageAndNotify } from "@/lib/messaging";
import { messageSendLimiter, getClientIdentifier } from "@/lib/rateLimit";
import { verifyOrigin, forbiddenOrigin } from "@/lib/csrf";

const CONVERSATIONS_PAGE_SIZE = 30;
const CONVERSATIONS_PAGE_SIZE_MAX = 50;

/**
 * Lists the current user's conversations, newest activity first (paginated).
 * Pass `withUserId` instead to do a direct, non-paginated lookup of the
 * single conversation with that specific person (used by the "Message"
 * button to reopen an existing thread instead of always starting fresh —
 * scanning a paginated list for this would miss matches past page one).
 */
export async function GET(request) {
  const user = await requireAuth(request);
  if (!user) return unauthorized();

  const url = new URL(request.url);
  const withUserId = url.searchParams.get("withUserId");

  if (withUserId) {
    const [userOneId, userTwoId] = [user.id, withUserId].sort();
    const { rows } = await query(
      `SELECT c.id, c.post_id as "postId", c.last_message_at as "lastMessageAt",
              ou.id as "otherUserId", ou.username as "otherUsername", ou."avatarUrl" as "otherAvatarUrl"
       FROM conversations c
       JOIN "User" ou ON ou.id = $3
       WHERE c.user_one_id = $1 AND c.user_two_id = $2`,
      [userOneId, userTwoId, withUserId]
    );
    const c = rows[0];
    if (!c) return ok({ conversation: null });
    return ok({
      conversation: {
        id: c.id,
        postId: c.postId,
        lastMessageAt: c.lastMessageAt,
        otherUser: { id: c.otherUserId, username: c.otherUsername, avatarUrl: c.otherAvatarUrl },
      },
    });
  }

  const cursor = url.searchParams.get("cursor"); // a conversation id to paginate after
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit")) || CONVERSATIONS_PAGE_SIZE, 1),
    CONVERSATIONS_PAGE_SIZE_MAX
  );

  const params = [user.id];
  let cursorClause = "";
  if (cursor) {
    const { rows: cRows } = await query(`SELECT last_message_at FROM conversations WHERE id = $1`, [cursor]);
    if (cRows[0]) {
      params.push(cRows[0].last_message_at, cursor);
      cursorClause = `AND (c.last_message_at, c.id) < ($2, $3)`;
    }
  }

  const { rows } = await query(
    `SELECT c.id, c.post_id as "postId", c.last_message_at as "lastMessageAt", c.created_at as "createdAt",
            ou.id as "otherUserId", ou.username as "otherUsername", ou."avatarUrl" as "otherAvatarUrl",
            lm.body as "lastMessageBody", lm.sender_id as "lastMessageSenderId",
            p.title as "postTitle",
            (SELECT COUNT(*)::int FROM messages m
              WHERE m.conversation_id = c.id AND m.sender_id != $1 AND m.read_at IS NULL) as "unreadCount"
     FROM conversations c
     JOIN "User" ou ON ou.id = (CASE WHEN c.user_one_id = $1 THEN c.user_two_id ELSE c.user_one_id END)
     LEFT JOIN "Post" p ON p.id = c.post_id
     LEFT JOIN LATERAL (
       SELECT body, sender_id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1
     ) lm ON true
     WHERE (c.user_one_id = $1 OR c.user_two_id = $1) ${cursorClause}
     ORDER BY c.last_message_at DESC, c.id DESC
     LIMIT ${limit}`,
    params
  );

  const conversations = rows.map((r) => ({
    id: r.id,
    postId: r.postId,
    postTitle: r.postTitle,
    lastMessageAt: r.lastMessageAt,
    lastMessageBody: r.lastMessageBody,
    unreadCount: r.unreadCount,
    otherUser: { id: r.otherUserId, username: r.otherUsername, avatarUrl: r.otherAvatarUrl },
  }));

  const nextCursor = conversations.length === limit ? conversations[conversations.length - 1].id : null;
  return ok({ conversations, nextCursor });
}

/**
 * Starts (or reuses) a conversation with another user and sends the first
 * message. Used by the "message" icon on a post or a profile.
 * Body: { toUserId, message, postId? }
 */
export async function POST(request) {
  if (!verifyOrigin(request)) return forbiddenOrigin();

  const user = await requireAuth(request);
  if (!user) return unauthorized();

  const identifier = getClientIdentifier(request, user.id);
  const { success } = await messageSendLimiter(identifier);
  if (!success) return rateLimited("You're sending messages too fast, try again shortly");

  const body = await request.json().catch(() => null);
  const toUserId = body?.toUserId;
  const text = body?.message?.trim();
  const postId = body?.postId || null;

  if (!toUserId || !text) return error("toUserId and message are required", 400);
  if (toUserId === user.id) return error("You can't message yourself", 400);
  if (text.length > 2000) return error("Message is too long", 400);

  const { rows: recipientRows } = await query(`SELECT id FROM "User" WHERE id = $1`, [toUserId]);
  if (!recipientRows[0]) return notFound("User not found");

  const conversation = await findOrCreateConversation(user.id, toUserId, postId);
  const message = await sendMessageAndNotify({ conversation, senderId: user.id, body: text, postId });

  return ok({ conversationId: conversation.id, message });
}
