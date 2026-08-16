"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useChat } from "@/components/ChatProvider";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";

const POLL_INTERVAL_MS = 15000;

function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function mergeConversations(prev, incoming) {
  const byId = new Map(prev.map((c) => [c.id, c]));
  for (const c of incoming) byId.set(c.id, c);
  return Array.from(byId.values()).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
}

export default function MessagesPage() {
  const router = useRouter();
  const { openChat } = useChat();
  const [conversations, setConversations] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);
  // Once the user pages past the first screen, the periodic poll should
  // stop touching `nextCursor` — otherwise a refresh every 15s would keep
  // snapping pagination back to page one.
  const hasLoadedMoreRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.getConversations();
        if (cancelled) return;
        setConversations((prev) => mergeConversations(prev || [], data.conversations));
        if (!hasLoadedMoreRef.current) setNextCursor(data.nextCursor);
      } catch {
        if (!cancelled) setLoggedOut(true);
      }
    }
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    hasLoadedMoreRef.current = true;
    try {
      const data = await api.getConversations(nextCursor);
      setConversations((prev) => mergeConversations(prev || [], data.conversations));
      setNextCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (loggedOut) router.push("/login");
  }, [loggedOut, router]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const data = await api.getConversations(nextCursor);
      setConversations((prev) => [...prev, ...data.conversations]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleOpen(c) {
    openChat({ conversationId: c.id, recipient: c.otherUser, postId: c.postId });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-xl font-semibold text-ink">Messages</h1>

      {conversations === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          description="When you message someone about a project — or they message you — it'll show up here."
        />
      ) : (
        <div className="space-y-1.5">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => handleOpen(c)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong hover:bg-canvas",
                c.unreadCount > 0 && "border-accent/30 bg-accent-light/30"
              )}
            >
              <Avatar src={c.otherUser.avatarUrl} alt={c.otherUser.username} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-ink">@{c.otherUser.username}</p>
                  <span className="shrink-0 text-xs text-ink-soft/70">{timeAgo(c.lastMessageAt)}</span>
                </div>
                {c.postTitle && <p className="truncate text-xs text-ink-soft/70">Re: {c.postTitle}</p>}
                <p className="mt-0.5 truncate text-sm text-ink-soft">{c.lastMessageBody}</p>
              </div>
              {c.unreadCount > 0 && (
                <span className="inline-flex size-2 shrink-0 rounded-full bg-accent" aria-hidden />
              )}
            </button>
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="sm" onClick={loadMore} loading={loadingMore}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
