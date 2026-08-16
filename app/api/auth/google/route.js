import { NextResponse } from "next/server";

export async function GET(request) {
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/google/callback`;

  const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizeUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(authorizeUrl.toString());
}
