-- ============================================================================
-- ProjectCollab — modification.sql
-- Paste this whole file into the Neon SQL editor (or `psql`) and run it once.
-- It only ADDS new tables for messaging/notifications — it does not touch
-- your existing "User" / "Post" / "Like" / "Save" / "RefreshToken" tables
-- or their data, so it's safe to run against your already-deployed database.
-- ============================================================================

-- One conversation per pair of users. user_one_id/user_two_id are always
-- stored sorted (smaller id first) so it doesn't matter who messaged whom
-- first — there's only ever one thread between any two people.
CREATE TABLE IF NOT EXISTS conversations (
  id               text PRIMARY KEY,
  post_id          text REFERENCES "Post"(id) ON DELETE SET NULL,
  user_one_id      text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  user_two_id      text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_message_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_pair_unique UNIQUE (user_one_id, user_two_id)
);

CREATE INDEX IF NOT EXISTS conversations_user_one_idx ON conversations (user_one_id);
CREATE INDEX IF NOT EXISTS conversations_user_two_idx ON conversations (user_two_id);
CREATE INDEX IF NOT EXISTS conversations_last_message_idx ON conversations (last_message_at DESC);

-- Individual chat messages within a conversation.
CREATE TABLE IF NOT EXISTS messages (
  id               text PRIMARY KEY,
  conversation_id  text NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id        text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  body             text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  read_at          timestamptz
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages (conversation_id, created_at);

-- Notification inbox (currently only "message" notifications are created,
-- but `type` is free text so future notification kinds can reuse this table).
CREATE TABLE IF NOT EXISTS notifications (
  id               text PRIMARY KEY,
  user_id          text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  from_user_id     text REFERENCES "User"(id) ON DELETE SET NULL,
  type             text NOT NULL DEFAULT 'message',
  post_id          text REFERENCES "Post"(id) ON DELETE SET NULL,
  conversation_id  text REFERENCES conversations(id) ON DELETE CASCADE,
  message          text,
  read             boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, read, created_at DESC);
