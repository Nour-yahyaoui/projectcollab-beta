"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Bookmark, MessageCircle, ExternalLink, Trash2, Users } from "lucide-react";
import CategoryBadge from "@/components/CategoryBadge";
import TechTag from "@/components/TechTag";
import Avatar from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useChat } from "@/components/ChatProvider";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";

export default function PostDetailClient({ id }) {
  const router = useRouter();
  const { openChatWithUser } = useChat();
  const [post, setPost] = useState(null);
  const [userId, setUserId] = useState(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.me().then((u) => setUserId(u.id)).catch(() => setUserId(null));
    api
      .getPost(id)
      .then((p) => {
        setPost(p);
        setLiked(Boolean(p.likedByMe));
        setSaved(Boolean(p.savedByMe));
      })
      .catch(() => setNotFound(true));
  }, [id]);

  async function handleLike() {
    if (!userId) return;
    const prevLiked = liked;
    setLiked(!prevLiked);
    setPost((p) => ({ ...p, likesCount: p.likesCount + (!prevLiked ? 1 : -1) }));
    try {
      const { liked: nowLiked } = await api.toggleLike(post.id);
      setLiked(nowLiked);
    } catch {
      setLiked(prevLiked);
      setPost((p) => ({ ...p, likesCount: p.likesCount + (prevLiked ? 1 : -1) }));
    }
  }

  async function handleSave() {
    if (!userId) return;
    const prevSaved = saved;
    setSaved(!prevSaved);
    try {
      const { saved: nowSaved } = await api.toggleSave(post.id);
      setSaved(nowSaved);
    } catch {
      setSaved(prevSaved);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this project post? This can't be undone.")) return;
    await api.deletePost(post.id);
    router.push("/");
  }

  function handleMessage() {
    if (!userId) {
      router.push("/login");
      return;
    }
    openChatWithUser(post.user, post.id);
  }

  if (notFound) {
    return (
      <EmptyState
        title="Project not found"
        description="This project may have been deleted or the link is incorrect."
        action={
          <Link href="/" className="text-sm font-medium text-accent hover:text-accent-dark">
            Back to feed
          </Link>
        }
      />
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="mt-4 h-8 w-2/3" />
          <Skeleton className="mt-3 h-5 w-32" />
          <Skeleton className="mt-6 h-24 w-full" />
        </div>
      </div>
    );
  }

  const isOwner = userId === post.user.id;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="mb-3 flex items-center justify-between">
          <CategoryBadge category={post.category} />
          <span className="text-xs text-ink-soft/70">{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>

        <h1 className="font-display text-2xl font-semibold text-ink">{post.title}</h1>

        <Link
          href={`/profile/${post.user.id}`}
          className="mt-2.5 flex w-fit items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
        >
          <Avatar src={post.user.avatarUrl} alt={post.user.username} size="xs" />
          <span className="font-mono">@{post.user.username}</span>
        </Link>

        <p className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">{post.description}</p>

        {post.techStack?.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {post.techStack.map((t) => (
              <TechTag key={t}>{t}</TechTag>
            ))}
          </div>
        )}

        {post.githubUrl && (
          <a
            href={post.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-sm text-accent hover:text-accent-dark hover:underline"
          >
            {post.githubUrl}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}

        {post.category === "COLLAB" && post.contributorsNeeded > 0 && (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-ink-soft">
            <Users className="size-4" aria-hidden />
            Looking for <strong className="text-ink">{post.contributorsNeeded}</strong> contributor
            {post.contributorsNeeded > 1 ? "s" : ""}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              disabled={!userId}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                liked ? "bg-like-light text-like" : "text-ink-soft hover:bg-canvas hover:text-like"
              )}
            >
              <Heart className="size-4" fill={liked ? "currentColor" : "none"} strokeWidth={2} aria-hidden />
              {post.likesCount}
            </button>
            <button
              onClick={handleSave}
              disabled={!userId}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                saved ? "bg-accent-light text-accent" : "text-ink-soft hover:bg-canvas hover:text-accent"
              )}
            >
              <Bookmark className="size-4" fill={saved ? "currentColor" : "none"} strokeWidth={2} aria-hidden />
              {saved ? "Saved" : "Save"}
            </button>
            {!isOwner && (
              <button
                onClick={handleMessage}
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-border-strong hover:text-accent"
              >
                <MessageCircle className="size-4" aria-hidden />
                Message
              </button>
            )}
          </div>

          {isOwner && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger-light"
            >
              <Trash2 className="size-4" aria-hidden />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
