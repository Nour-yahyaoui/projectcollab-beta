import { query, withTransaction } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, unauthorized, notFound } from "@/lib/apiResponse";
import { verifyOrigin, forbiddenOrigin } from "@/lib/csrf";

export async function POST(request, { params }) {
  if (!verifyOrigin(request)) return forbiddenOrigin();

  const user = await requireAuth(request);
  if (!user) return unauthorized();

  const { rows: postRows } = await query(`SELECT id FROM "Post" WHERE id = $1`, [params.id]);
  if (!postRows[0]) return notFound("Post not found");

  const { rows: existingRows } = await query(
    `SELECT 1 FROM "Save" WHERE "userId" = $1 AND "postId" = $2`,
    [user.id, params.id]
  );

  if (existingRows[0]) {
    await withTransaction(async (client) => {
      await client.query(`DELETE FROM "Save" WHERE "userId" = $1 AND "postId" = $2`, [user.id, params.id]);
      await client.query(`UPDATE "Post" SET "savedCount" = "savedCount" - 1 WHERE id = $1`, [params.id]);
    });
    return ok({ saved: false });
  }

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO "Save" ("userId", "postId", "createdAt") VALUES ($1, $2, now())`,
      [user.id, params.id]
    );
    await client.query(`UPDATE "Post" SET "savedCount" = "savedCount" + 1 WHERE id = $1`, [params.id]);
  });
  return ok({ saved: true });
}
