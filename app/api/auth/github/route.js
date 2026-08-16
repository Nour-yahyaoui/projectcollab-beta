import { NextResponse } from "next/server";

// Starts the web OAuth flow. Mobile apps don't hit this route — they run
// their own in-browser OAuth (expo-auth-session, AppAuth, flutter_web_auth)
// and post the resulting code straight to /api/auth/mobile instead.
export async function GET(request) {
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/github/callback`;

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "read:user user:email");

  return NextResponse.redirect(authorizeUrl.toString());
}
