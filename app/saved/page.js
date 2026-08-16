"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import PostCard from "@/components/PostCard";
import EmptyState from "@/components/ui/EmptyState";
import { FeedSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";

export default function SavedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    api
      .me()
      .then((u) => setUserId(u.id))
      .catch(() => router.push("/login"));
    api
      .getSaved()
      .then((d) => setPosts(d.posts.map((p) => ({ ...p, savedByMe: true }))))
      .catch(() => setPosts([]));
  }, [router]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-ink">Saved</h1>

      {posts === null ? (
        <FeedSkeleton count={4} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Bookmark a project from the feed to find it here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={userId} />
          ))}
        </div>
      )}
    </div>
  );
}
