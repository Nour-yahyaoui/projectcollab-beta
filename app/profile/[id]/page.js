"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, FolderKanban } from "lucide-react";
import PostCard from "@/components/PostCard";
import TechTag from "@/components/TechTag";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { FeedSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useChat } from "@/components/ChatProvider";
import { api } from "@/lib/api";

export default function ProfilePage({ params }) {
  const router = useRouter();
  const { openChatWithUser } = useChat();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    api.me().then((u) => setUserId(u.id)).catch(() => setUserId(null));
    api.getUser(params.id).then(setProfile);
    api.getUserPosts(params.id).then((d) => {
      setPosts(d.posts);
      setNextCursor(d.nextCursor);
    });
  }, [params.id]);

  async function loadMorePosts() {
    setLoadingMore(true);
    try {
      const d = await api.getUserPosts(params.id, nextCursor);
      setPosts((prev) => [...prev, ...d.posts]);
      setNextCursor(d.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleMessage() {
    if (!userId) {
      router.push("/login");
      return;
    }
    openChatWithUser({ id: profile.id, username: profile.username, avatarUrl: profile.avatarUrl });
  }

  const isSelf = userId === params.id;

  if (!profile) {
    return (
      <div>
        <div className="mb-8 rounded-2xl border border-border bg-surface p-8 shadow-card">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-2 h-4 w-56" />
            </div>
          </div>
        </div>
        <FeedSkeleton count={2} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar src={profile.avatarUrl} alt={profile.username} size="xl" />
            <div>
              <h1 className="font-display text-xl font-semibold text-ink">@{profile.username}</h1>
              {profile.bio && <p className="mt-1 max-w-md text-sm text-ink-soft">{profile.bio}</p>}
            </div>
          </div>
          {!isSelf && (
            <button
              onClick={handleMessage}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-border-strong hover:text-accent"
            >
              <MessageCircle className="size-4" aria-hidden />
              Message
            </button>
          )}
        </div>

        {profile.techStack?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {profile.techStack.map((t) => (
              <TechTag key={t}>{t}</TechTag>
            ))}
          </div>
        )}
      </div>

      <h2 className="mb-4 flex items-center gap-1.5 font-display text-lg font-semibold text-ink">
        <FolderKanban className="size-[18px]" aria-hidden />
        Projects
      </h2>
      {posts === null ? (
        <FeedSkeleton count={2} />
      ) : posts.length === 0 ? (
        <EmptyState title="No projects posted yet" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={userId} />
            ))}
          </div>
          {nextCursor && (
            <div className="mt-6 flex justify-center">
              <Button variant="secondary" size="sm" onClick={loadMorePosts} loading={loadingMore}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
