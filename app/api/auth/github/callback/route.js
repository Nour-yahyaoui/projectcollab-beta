import { NextResponse } from "next/server";
import { exchangeGithubCode, findOrCreateUser } from "@/lib/oauth";
import { signAccessToken, issueRefreshToken, SESSION_COOKIE_NAME, REFRESH_TOKEN_TTL_SECONDS } from "@/lib/auth";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${url.origin}/login?error=missing_code`);
  }

  try {
    const redirectUri = `${url.origin}/api/auth/github/callback`;
    const profile = await exchangeGithubCode(code, redirectUri);
    const user = await findOrCreateUser("GITHUB", profile);

    const accessToken = signAccessToken(user.id);
    const refreshToken = await issueRefreshToken(user.id, "web");

    const response = NextResponse.redirect(`${url.origin}/`);
    response.cookies.set("pc_session", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
    response.cookies.set("pc_refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });
    return response;
  } catch (err) {
    console.error("GitHub OAuth callback failed:", err);
    return NextResponse.redirect(`${url.origin}/login?error=oauth_failed`);
  }
}
