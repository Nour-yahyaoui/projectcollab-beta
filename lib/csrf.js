import { error } from "./apiResponse";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Defense-in-depth CSRF check for our cookie-authenticated (web) flows.
 *
 * CSRF only matters when a request rides along an ambient credential the
 * browser sends automatically — our `pc_session`/`pc_refresh` cookies. If
 * neither cookie is present, this is a mobile/Bearer-token request instead
 * (those require the client to explicitly hold and send a token — nothing
 * for a forged cross-site request to ride along on), so it's exempt.
 *
 * For everything else, browsers always attach an Origin header (and
 * usually Referer) on state-changing cross-origin requests. A same-site
 * request will match our own host; a forged one from another site won't.
 * `sameSite: "lax"` on our cookies already blocks most of this, but this
 * catches the edge cases (older browsers, non-fetch vectors) that Lax
 * alone doesn't.
 */
export function verifyOrigin(request) {
  if (SAFE_METHODS.has(request.method)) return true;

  const hasSessionCookie = Boolean(
    request.cookies?.get("pc_session")?.value || request.cookies?.get("pc_refresh")?.value
  );
  if (!hasSessionCookie) return true; // mobile / Bearer-token flow — no ambient credential to forge

  const allowedHosts = getAllowedHosts(request);
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return allowedHosts.has(new URL(origin).host);
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return allowedHosts.has(new URL(referer).host);
    } catch {
      return false;
    }
  }

  // Neither header present on a cookie-carrying request — reject. A real
  // browser always sends at least one on a state-changing request.
  return false;
}

function getAllowedHosts(request) {
  const hosts = new Set();
  const hostHeader = request.headers.get("host");
  if (hostHeader) hosts.add(hostHeader);
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      hosts.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).host);
    } catch {
      /* ignore malformed env value */
    }
  }
  return hosts;
}

export function forbiddenOrigin() {
  return error("Request origin could not be verified", 403);
}
