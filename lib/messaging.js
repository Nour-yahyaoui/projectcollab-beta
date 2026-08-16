import { query, genId } from "./db";

/**
 * Finds the existing conversation between two users, or creates one.
 * Conversations are keyed by the sorted pair of user ids, so it doesn't
 * matter who messages whom first — they always land in the same thread.
 */
export async function findOrCreateConversation(userIdA, userIdB, postId = null) {
  const [userOneId, userTwoId] = [userIdA, userIdB].sort();

  const { rows: existing } = await query(
    `SELECT * FROM conversations WHERE user_one_id = $1 AND user_two_id = $2`,
    [userOneId, userTwoId]
  );
  if (existing[0]) return existing[0];

  const id = genId();
  const { rows } = await query(
    `INSERT INTO conversations (id, post_id, user_one_id, user_two_id, created_at, last_message_at)
     VALUES ($1, $2, $3, $4, now(), now())
     RETURNING *`,
    [id, postId, userOneId, userTwoId]
  );
  return rows[0];
}

export function otherParticipant(conversation, userId) {
  return conversation.user_one_id === userId ? conversation.user_two_id : conversation.user_one_id;
}

/** Sends a message in a conversation and creates a notification for the recipient. */
export async function sendMessageAndNotify({ conversation, senderId, body, postId }) {
  const messageId = genId();
  const { rows: msgRows } = await query(
    `INSERT INTO messages (id, conversation_id, sender_id, body, created_at)
     VALUES ($1, $2, $3, $4, now())
     RETURNING *`,
    [messageId, conversation.id, senderId, body]
  );

  await query(`UPDATE conversations SET last_message_at = now() WHERE id = $1`, [conversation.id]);

  const recipientId = otherParticipant(conversation, senderId);
  const notificationId = genId();
  await query(
    `INSERT INTO notifications (id, user_id, from_user_id, type, post_id, conversation_id, message, read, created_at)
     VALUES ($1, $2, $3, 'message', $4, $5, $6, false, now())`,
    [notificationId, recipientId, senderId, postId ?? conversation.post_id, conversation.id, body.slice(0, 200)]
  );

  return msgRows[0];
}
