import { query, shapeWithUser } from "@/lib/db";
import { requireAuth, getUserIdFromRequest } from "@/lib/auth";
import { ok, error, notFound, unauthorized } from "@/lib/apiResponse";
import { withSingleViewerState } from "@/lib/postState";
import { verifyOrigin, forbiddenOrigin } from "@/lib/csrf";
import { validateTitle, validateDescription, validateGithubUrl, sanitizeTechStack, sanitizeContributorsNeeded } from "@/lib/validate";

export async function GET(request, { params }) {
  const { rows } = await query(
    `SELECT p.*,
            u.id as "userIdRef",
            u.username as "userUsername",
            u."avatarUrl" as "userAvatarUrl",
            u.bio as "userBio"
     FROM "Post" p
     JOIN "User" u ON u.id = p."userId"
     WHERE p.id = $1`,
    [params.id]
  );
  if (!rows[0]) return notFound("Post not found");

  const post = shapeWithUser(rows[0]);
  const userId = getUserIdFromRequest(request);
  return ok(await withSingleViewerState(post, userId));
}

export async function PUT(request, { params }) {
  if (!verifyOrigin(request)) return forbiddenOrigin();

  const user = await requireAuth(request);
  if (!user) return unauthorized();

  const { rows: existingRows } = await query(`SELECT * FROM "Post" WHERE id = $1`, [params.id]);
  const post = existingRows[0];
  if (!post) return notFound("Post not found");
  if (post.userId !== user.id) return error("You can only edit your own posts", 403);

  const body = await request.json().catch(() => null);
  if (!body) return error("Invalid request body", 400);

  const title = body.title ?? post.title;
  const description = body.description ?? post.description;
  const githubUrl = body.githubUrl ?? post.githubUrl;

  const titleErr = validateTitle(title);
  if (titleErr) return error(titleErr, 400);
  const descErr = validateDescription(description);
  if (descErr) return error(descErr, 400);
  const urlErr = validateGithubUrl(githubUrl);
  if (urlErr) return error(urlErr, 400);

  const techStack = body.techStack !== undefined ? sanitizeTechStack(body.techStack) : post.techStack;
  const contributorsNeeded =
    body.contributorsNeeded !== undefined ? sanitizeContributorsNeeded(body.contributorsNeeded) : post.contributorsNeeded;

  const { rows } = await query(
    `UPDATE "Post"
     SET title = $1, description = $2, "githubUrl" = $3, "techStack" = $4, "contributorsNeeded" = $5, "updatedAt" = now()
     WHERE id = $6
     RETURNING *`,
    [title, description, githubUrl, techStack, contributorsNeeded, params.id]
  );

  return ok(rows[0]);
}

export async function DELETE(request, { params }) {
  if (!verifyOrigin(request)) return forbiddenOrigin();

  const user = await requireAuth(request);
  if (!user) return unauthorized();

  const { rows: existingRows } = await query(`SELECT * FROM "Post" WHERE id = $1`, [params.id]);
  const post = existingRows[0];
  if (!post) return notFound("Post not found");
  if (post.userId !== user.id) return error("You can only delete your own posts", 403);

  await query(`DELETE FROM "Post" WHERE id = $1`, [params.id]);
  return ok({ success: true });
}
