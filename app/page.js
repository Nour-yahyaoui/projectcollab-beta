"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, FolderPlus, Search, X } from "lucide-react";
import PostCard from "@/components/PostCard";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { FeedSkeleton } from "@/components/ui/Skeleton";
import { CATEGORY_LIST } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";

const FILTERS = [{ value: null, label: "All", icon: LayoutGrid }, ...CATEGORY_LIST];
const SEARCH_DEBOUNCE_MS = 350;

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    api.me().then((u) => setUserId(u.id)).catch(() => setUserId(null));
  }, []);

  // Debounce typing before it becomes an actual query, so every keystroke
  // doesn't fire a request.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Re-fetches whenever the category filter OR the search query changes,
  // and always resets pagination — this is the bug fix: previously a
  // filter change didn't reliably combine with pagination state.
  useEffect(() => {
    setLoading(true);
    setCursor(null);
    api
      .getFeed(category, null, search || undefined)
      .then((data) => {
        setPosts(data.posts);
        setCursor(data.nextCursor);
      })
      .finally(() => setLoading(false));
  }, [category, search]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const data = await api.getFeed(category, cursor, search || undefined);
      setPosts((prev) => [...prev, ...data.posts]);
      setCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Feed</h1>
          <p className="mt-0.5 text-sm text-ink-soft">Discover projects, find collaborators, build together.</p>
        </div>
        {userId && (
          <CreateProjectDialog
            trigger={
              <Button>
                <FolderPlus className="size-4" aria-hidden />
                New project
              </Button>
            }
          />
        )}
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft/60" aria-hidden />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search projects…"
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-8 text-sm text-ink placeholder:text-ink-soft/50 transition-colors focus:border-accent focus:outline-none"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft/60 hover:text-ink"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {FILTERS.map((c) => {
          const Icon = c.icon;
          const selected = category === c.value;
          return (
            <button
              key={c.label}
              onClick={() => setCategory(c.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                selected
                  ? "bg-accent text-white"
                  : "border border-border bg-surface text-ink-soft hover:border-border-strong hover:text-ink"
              )}
            >
              <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
              {c.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <FeedSkeleton />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title={search ? "No matching projects" : "Nothing here yet"}
          description={
            search
              ? `No projects match "${search}". Try a different search or filter.`
              : "Be the first to post a project in this category."
          }
          action={
            userId ? (
              <CreateProjectDialog />
            ) : (
              <Button as="a" href="/login">
                Sign in to post
              </Button>
            )
          }
        />
      ) : (
        // Changed from sm:grid-cols-2 to a single column layout
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={userId} />
          ))}
        </div>
      )}

      {cursor && !loading && (
        <div className="mt-8 text-center">
          <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}