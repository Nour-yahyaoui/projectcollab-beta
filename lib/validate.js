// Central place for input-size limits so validation stays consistent
// across the create/edit routes instead of drifting between them.
export const LIMITS = {
  postTitle: 120,
  postDescription: 5000,
  githubUrl: 300,
  techTag: 30,
  techStackItems: 15,
  contributorsNeeded: 500,
  bio: 500,
  message: 2000,
  searchQuery: 100,
};

export function validateTitle(title) {
  if (typeof title !== "string" || !title.trim()) return "title is required";
  if (title.length > LIMITS.postTitle) return `title must be ${LIMITS.postTitle} characters or fewer`;
  return null;
}

export function validateDescription(description) {
  if (typeof description !== "string" || !description.trim()) return "description is required";
  if (description.length > LIMITS.postDescription) {
    return `description must be ${LIMITS.postDescription} characters or fewer`;
  }
  return null;
}

export function validateGithubUrl(url) {
  if (url === undefined || url === null || url === "") return null; // optional field
  if (typeof url !== "string" || url.length > LIMITS.githubUrl) {
    return `githubUrl must be ${LIMITS.githubUrl} characters or fewer`;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return "githubUrl must be a valid http(s) URL";
    }
  } catch {
    return "githubUrl must be a valid URL";
  }
  return null;
}

export function validateBio(bio) {
  if (bio === undefined || bio === null) return null;
  if (typeof bio !== "string" || bio.length > LIMITS.bio) return `bio must be ${LIMITS.bio} characters or fewer`;
  return null;
}

/** Clamps a tech stack array to a sane shape — never throws on bad input. */
export function sanitizeTechStack(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((t) => typeof t === "string" && t.trim())
    .slice(0, LIMITS.techStackItems)
    .map((t) => t.trim().slice(0, LIMITS.techTag));
}

export function sanitizeContributorsNeeded(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.trunc(n), LIMITS.contributorsNeeded);
}
