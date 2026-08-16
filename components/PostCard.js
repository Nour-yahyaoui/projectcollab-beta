"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Bookmark } from "lucide-react";
import CategoryBadge from "./CategoryBadge";
import TechTag from "./TechTag";
import Avatar from "./ui/Avatar";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";

function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function PostCard({ post, currentUserId }) {
  const [likes, setLikes] = useState(post.likesCount);
  const [liked, setLiked] = useState(Boolean(post.likedByMe));
  const [saved, setSaved] = useState(Boolean(post.savedByMe));
  const [busy, setBusy] = useState(false);

  async function handleLike(e) {
    e.preventDefault();
    if (!currentUserId || busy) return;
    setBusy(true);
    const prevLiked = liked;
    setLiked(!prevLiked);
    setLikes((n) => n + (!prevLiked ? 1 : -1));
    try {
      const { liked: nowLiked } = await api.toggleLike(post.id);
      setLiked(nowLiked);
    } catch {
      setLiked(prevLiked);
      setLikes((n) => n + (prevLiked ? 1 : -1));
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!currentUserId || busy) return;
    setBusy(true);
    const prevSaved = saved;
    setSaved(!prevSaved);
    try {
      const { saved: nowSaved } = await api.toggleSave(post.id);
      setSaved(nowSaved);
    } catch {
      setSaved(prevSaved);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Link
      href={`/post/${post.id}`}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover"
    >
      <div className="mb-3 flex items-center justify-between">
        <CategoryBadge category={post.category} />
        <span className="text-xs text-ink-soft/70">{timeAgo(post.createdAt)}</span>
      </div>

      <h3 className="font-display text-[17px] font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
        {post.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-ink-soft">{post.description}</p>

      {post.techStack?.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {post.techStack.slice(0, 5).map((t) => (
            <TechTag key={t}>{t}</TechTag>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3.5">
        <div className="flex items-center gap-2">
          <Avatar src={post.user?.avatarUrl} alt={post.user?.username} size="xs" />
          <span className="font-mono text-xs text-ink-soft">@{post.user?.username}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            disabled={!currentUserId}
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              liked ? "text-like" : "text-ink-soft hover:bg-canvas hover:text-like"
            )}
            aria-label={liked ? "Unlike" : "Like"}
          >
            <Heart className="size-3.5" fill={liked ? "currentColor" : "none"} strokeWidth={2} aria-hidden />
            {likes}
          </button>
          <button
            onClick={handleSave}
            disabled={!currentUserId}
            className={cn(
              "flex items-center rounded-full p-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              saved ? "text-accent" : "text-ink-soft hover:bg-canvas hover:text-accent"
            )}
            aria-label={saved ? "Unsave" : "Save"}
          >
            <Bookmark className="size-3.5" fill={saved ? "currentColor" : "none"} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </Link>
  );
}
