-- ============================================================================
-- ProjectCollab — modification_2.sql
-- Performance/scalability indexes. Paste into the Neon SQL editor and run
-- once. Purely additive (indexes only) — safe to run on a live database,
-- no data is touched. `IF NOT EXISTS` makes this safe to re-run too.
-- ============================================================================

-- Full-text-ish search support for the feed's search bar. Without this,
-- `WHERE title ILIKE '%q%'` forces a full sequential scan of "Post" on
-- every search — fine at a few hundred rows, slow once the table grows.
-- pg_trgm lets Postgres use a GIN index for ILIKE/substring matches.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS post_title_trgm_idx ON "Post" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS post_description_trgm_idx ON "Post" USING GIN (description gin_trgm_ops);

-- Supports the feed's most common query shape: filter by category, sort by
-- newest first. Without this, a category filter still has to sort the
-- matching rows from scratch instead of walking a pre-sorted index.
CREATE INDEX IF NOT EXISTS post_category_created_idx ON "Post" (category, "createdAt" DESC);

-- Supports "my profile's posts" / "user X's posts" queries (WHERE "userId" = ...).
CREATE INDEX IF NOT EXISTS post_user_idx ON "Post" ("userId");

-- Supports refresh-token lookup/rotation, which runs on essentially every
-- authenticated request that needs a token refresh — a hot path.
-- (Harmless if Prisma already created an index here via @unique — Postgres
-- just ends up with a small amount of redundant, not broken, indexing.)
CREATE INDEX IF NOT EXISTS refresh_token_hash_idx ON "RefreshToken" ("tokenHash");
CREATE INDEX IF NOT EXISTS refresh_token_user_idx ON "RefreshToken" ("userId");

-- Supports OAuth login lookup (find-or-create by provider + providerId).
CREATE INDEX IF NOT EXISTS user_provider_idx ON "User" (provider, "providerId");
