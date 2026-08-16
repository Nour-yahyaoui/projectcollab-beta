import { NextResponse } from "next/server";
import { rotateRefreshToken, signAccessToken, REFRESH_TOKEN_TTL_SECONDS } from "@/lib/auth";
import { ok, error } from "@/lib/apiResponse";
import { verifyOrigin, forbiddenOrigin } from "@/lib/csrf";

/**
 * Web: reads the refresh token from the `pc_refresh` httpOnly cookie and
 *      responds by re-setting both cookies.
 * Mobile: reads `{ refreshToken }` from the JSON body and responds with
 *      new tokens in the JSON body for the app to re-store.
 */
export async function POST(request) {
  if (!verifyOrigin(request)) return forbiddenOrigin();

  const cookieToken = request.cookies.get("pc_refresh")?.value;
  const body = await request.json().catch(() => ({}));
  const rawToken = body?.refreshToken || cookieToken;

  if (!rawToken) return error("No refresh token provided", 401);

  const result = await rotateRefreshToken(rawToken);
  if (!result) return error("Refresh token invalid or expired", 401);

  const accessToken = signAccessToken(result.userId);

  if (body?.refreshToken) {
    // mobile client
    return ok({ accessToken, refreshToken: result.refreshToken, expiresIn: 15 * 60 });
  }

  // web client
  const response = NextResponse.json({ accessToken, expiresIn: 15 * 60 });
  response.cookies.set("pc_session", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
  response.cookies.set("pc_refresh", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });
  return response;
}
