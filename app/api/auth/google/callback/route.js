import { NextResponse } from "next/server";
import { exchangeGoogleCode, findOrCreateUser } from "@/lib/oauth";
import { signAccessToken, issueRefreshToken, REFRESH_TOKEN_TTL_SECONDS } from "@/lib/auth";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${url.origin}/login?error=missing_code`);
  }

  try {
    const redirectUri = `${url.origin}/api/auth/google/callback`;
    const profile = await exchangeGoogleCode(code, redirectUri);
    const user = await findOrCreateUser("GOOGLE", profile);

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
    console.error("Google OAuth callback failed:", err);
    return NextResponse.redirect(`${url.origin}/login?error=oauth_failed`);
  }
}
