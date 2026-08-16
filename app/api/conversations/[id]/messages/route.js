import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, error, unauthorized, notFound, rateLimited } from "@/lib/apiResponse";
import { sendMessageAndNotify } from "@/lib/messaging";
import { messageSendLimiter, getClientIdentifier } from "@/lib/rateLimit";
import { verifyOrigin, forbiddenOrigin } from "@/lib/csrf";

async function loadConversation(id, userId) {
  const { rows } = await query(`SELECT * FROM conversations WHERE id = $1`, [id]);
  const conversation = rows[0];
  if (!conversation) return null;
  if (conversation.user_one_id !== userId && conversation.user_two_id !== userId) return null;
  return conversation;
}

/**
 * Returns messages in a conversation. Pass `after` (an ISO timestamp) to
 * only get messages newer than that — this is what the chat window polls
 * with every few seconds instead of using a websocket.
 */
export async function GET(request, { params }) {
  const user = await requireAuth(request);
  if (!user) return unauthorized();

  const conversation = await loadConversation(params.id, user.id);
  if (!conversation) return notFound("Conversation not found");

  const url = new URL(request.url);
  const after = url.searchParams.get("after");

  const { rows } = after
    ? await query(
        `SELECT * FROM messages WHERE conversation_id = $1 AND created_at > $2 ORDER BY created_at ASC`,
        [params.id, after]
      )
    : await query(
        `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [params.id]
      );

  const messages = after ? rows : rows.reverse();

  // Mark the other participant's messages as read now that we've fetched them.
  await query(
    `UPDATE messages SET read_at = now() WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL`,
    [params.id, user.id]
  );
  await query(
    `UPDATE notifications SET read = true WHERE conversation_id = $1 AND user_id = $2 AND read = false`,
    [params.id, user.id]
  );

  return ok({
    messages: messages.map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      body: m.body,
      createdAt: m.created_at,
      readAt: m.read_at,
    })),
  });
}

/** Sends a reply in an existing conversation. Body: { body } */
export async function POST(request, { params }) {
  if (!verifyOrigin(request)) return forbiddenOrigin();

  const user = await requireAuth(request);
  if (!user) return unauthorized();

  const identifier = getClientIdentifier(request, user.id);
  const { success } = await messageSendLimiter(identifier);
  if (!success) return rateLimited("You're sending messages too fast, try again shortly");

  const conversation = await loadConversation(params.id, user.id);
  if (!conversation) return notFound("Conversation not found");

  const body = await request.json().catch(() => null);
  const text = body?.body?.trim();
  if (!text) return error("body is required", 400);
  if (text.length > 2000) return error("Message is too long", 400);

  const message = await sendMessageAndNotify({ conversation, senderId: user.id, body: text });

  return ok({
    message: {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      body: message.body,
      createdAt: message.created_at,
    },
  });
}
