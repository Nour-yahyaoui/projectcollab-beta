"use client";

import { useRouter } from "next/navigation";
import PostForm from "@/components/PostForm";

export default function CreatePostPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 font-display text-2xl font-semibold text-ink">New project</h1>
      <p className="mb-6 text-sm text-ink-soft">
        Share what you're building, selling, or looking for collaborators on.
      </p>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-7">
        <PostForm onSuccess={(post) => router.push(`/post/${post.id}`)} />
      </div>
    </div>
  );
}
