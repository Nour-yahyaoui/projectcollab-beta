import { query } from "./db";

/**
 * Attaches `likedByMe` / `savedByMe` booleans for the requesting viewer.
 * Kept outside of any response caching layer so a cached/shared payload
 * never leaks one user's like/save state to another user.
 */
export async function withViewerState(posts, userId) {
  if (!userId || posts.length === 0) {
    return posts.map((p) => ({ ...p, likedByMe: false, savedByMe: false }));
  }
  const postIds = posts.map((p) => p.id);
  const [{ rows: likes }, { rows: saves }] = await Promise.all([
    query(`SELECT "postId" FROM "Like" WHERE "userId" = $1 AND "postId" = ANY($2::text[])`, [userId, postIds]),
    query(`SELECT "postId" FROM "Save" WHERE "userId" = $1 AND "postId" = ANY($2::text[])`, [userId, postIds]),
  ]);
  const likedSet = new Set(likes.map((l) => l.postId));
  const savedSet = new Set(saves.map((s) => s.postId));
  return posts.map((p) => ({
    ...p,
    likedByMe: likedSet.has(p.id),
    savedByMe: savedSet.has(p.id),
  }));
}

export async function withSingleViewerState(post, userId) {
  const [withState] = await withViewerState([post], userId);
  return withState;
}
