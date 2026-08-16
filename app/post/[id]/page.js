import { query } from "@/lib/db";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import PostDetailClient from "./PostDetailClient";

const SHORT_DESC_LENGTH = 160;

function truncate(text, max) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// Server-rendered metadata so sharing a post link shows a real preview card
// (platform tagline + a short excerpt of the post) instead of a bare URL.
export async function generateMetadata({ params }) {
  const { rows } = await query(`SELECT title, description FROM "Post" WHERE id = $1`, [params.id]);
  const post = rows[0];

  if (!post) {
    return {
      title: `Project not found · ${SITE_NAME}`,
      description: `${SITE_TAGLINE} This project may have been removed.`,
    };
  }

  const previewDescription = `${SITE_TAGLINE} ${truncate(post.description, SHORT_DESC_LENGTH)}`;

  return {
    title: `${post.title} · ${SITE_NAME}`,
    description: previewDescription,
    openGraph: {
      title: post.title,
      description: previewDescription,
      siteName: SITE_NAME,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: post.title,
      description: previewDescription,
    },
  };
}

export default function PostDetailPage({ params }) {
  return <PostDetailClient id={params.id} />;
}
