import { requireAuth } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/apiResponse";

export async function GET(request) {
  const user = await requireAuth(request);
  if (!user) return unauthorized();

  return ok({
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    techStack: user.techStack,
    provider: user.provider,
    createdAt: user.createdAt,
  });
}
