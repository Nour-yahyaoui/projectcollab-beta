import { query, genId } from "./db";

/**
 * Exchanges a GitHub OAuth `code` for an access token, then fetches the
 * profile. Used by the web callback route and the mobile exchange route.
 */
export async function exchangeGithubCode(code, redirectUri) {
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(tokenData.error_description || "GitHub token exchange failed");
  }

  const profileRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileRes.json();

  let email = profile.email;
  if (!email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const emails = await emailsRes.json();
    email = Array.isArray(emails) ? emails.find((e) => e.primary)?.email : null;
  }

  return {
    providerId: String(profile.id),
    username: profile.login,
    email,
    avatarUrl: profile.avatar_url,
  };
}

/** Same idea for Google. */
export async function exchangeGoogleCode(code, redirectUri) {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(tokenData.error_description || "Google token exchange failed");
  }

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileRes.json();

  return {
    providerId: profile.sub,
    username: profile.email?.split("@")[0] ?? `user_${profile.sub.slice(0, 8)}`,
    email: profile.email,
    avatarUrl: profile.picture,
  };
}

/**
 * Finds an existing user for this provider identity, or creates one.
 * Shared by web and mobile auth so account creation logic never drifts.
 */
export async function findOrCreateUser(provider, profile) {
  const { rows: existingRows } = await query(
    `SELECT * FROM "User" WHERE provider = $1::"AuthProvider" AND "providerId" = $2`,
    [provider, profile.providerId]
  );
  if (existingRows[0]) return existingRows[0];

  // ensure username uniqueness by suffixing if taken
  let username = profile.username || `user_${profile.providerId.slice(0, 8)}`;
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows } = await query(`SELECT 1 FROM "User" WHERE username = $1`, [username]);
    if (rows.length === 0) break;
    suffix += 1;
    username = `${profile.username}${suffix}`;
  }

  const id = genId();
  const { rows } = await query(
    `INSERT INTO "User" (id, provider, "providerId", username, email, "avatarUrl", "techStack", "createdAt", "updatedAt")
     VALUES ($1, $2::"AuthProvider", $3, $4, $5, $6, '{}', now(), now())
     RETURNING *`,
    [id, provider, profile.providerId, username, profile.email || null, profile.avatarUrl || null]
  );
  return rows[0];
}
