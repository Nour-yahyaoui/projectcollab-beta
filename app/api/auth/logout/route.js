import { NextResponse } from "next/server";
import { revokeRefreshToken } from "@/lib/auth";
import { ok } from "@/lib/apiResponse";
import { verifyOrigin, forbiddenOrigin } from "@/lib/csrf";

export async function POST(request) {
  if (!verifyOrigin(request)) return forbiddenOrigin();

  const cookieToken = request.cookies.get("pc_refresh")?.value;
  const body = await request.json().catch(() => ({}));
  const rawToken = body?.refreshToken || cookieToken;

  if (rawToken) await revokeRefreshToken(rawToken);

  if (body?.refreshToken) {
    // mobile: nothing to clear server-side, client just deletes stored tokens
    return ok({ success: true });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete("pc_session");
  response.cookies.delete("pc_refresh");
  return response;
}
