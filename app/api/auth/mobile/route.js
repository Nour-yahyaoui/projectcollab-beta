import { exchangeGithubCode, exchangeGoogleCode, findOrCreateUser } from "@/lib/oauth";
import { signAccessToken, issueRefreshToken } from "@/lib/auth";
import { ok, error } from "@/lib/apiResponse";
import { authLimiter, getClientIdentifier } from "@/lib/rateLimit";
import { verifyOrigin, forbiddenOrigin } from "@/lib/csrf";

/**
 * Mobile auth flow (React Native / Flutter):
 *
 * 1. The app opens the provider's OAuth screen in an in-app browser using
 *    expo-auth-session (RN) or flutter_web_auth_2 (Flutter), with its own
 *    redirect URI (a custom scheme like projectcollab://auth or an Expo
 *    proxy URL) registered on the GitHub/Google app.
 * 2. The provider redirects back to the app with an authorization `code`.
 * 3. The app POSTs that code here, along with the exact `redirectUri` it
 *    used (required — OAuth providers validate it matches).
 * 4. This route exchanges the code server-side (keeping the client secret
 *    off the device) and returns our own JWTs for the app to store in
 *    SecureStore (RN) / flutter_secure_storage (Flutter).
 *
 * Body: { provider: "github" | "google", code: string, redirectUri: string, device?: string }
 */
export async function POST(request) {
  if (!verifyOrigin(request)) return forbiddenOrigin();

  const identifier = getClientIdentifier(request, null);
  const { success } = await authLimiter(identifier);
  if (!success) return error("Too many auth attempts, try again shortly", 429);

  const body = await request.json().catch(() => null);
  if (!body?.provider || !body?.code || !body?.redirectUri) {
    return error("provider, code, and redirectUri are required", 400);
  }

  try {
    const profile =
      body.provider === "github"
        ? await exchangeGithubCode(body.code, body.redirectUri)
        : body.provider === "google"
        ? await exchangeGoogleCode(body.code, body.redirectUri)
        : null;

    if (!profile) return error("provider must be 'github' or 'google'", 400);

    const user = await findOrCreateUser(body.provider.toUpperCase(), profile);
    const accessToken = signAccessToken(user.id);
    const refreshToken = await issueRefreshToken(user.id, body.device || "mobile");

    return ok({
      accessToken,
      refreshToken,
      expiresIn: 15 * 60,
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        techStack: user.techStack,
      },
    });
  } catch (err) {
    console.error("Mobile OAuth exchange failed:", err);
    return error("OAuth exchange failed", 401);
  }
}
