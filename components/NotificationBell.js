"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, MessageCircle } from "lucide-react";
import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import Avatar from "./ui/Avatar";
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

/**
 * Bell icon + unread badge in the navbar. Opening a notification marks it
 * read and hands off to `onOpenChat` (the parent renders the ChatWindow).
 */
export default function NotificationBell({ onOpenChat }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const pollRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      /* not signed in, or a transient error — try again next tick */
    }
  }, []);

  useEffect(() => {
    refresh();
    pollRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [refresh]);

  async function handleSelect(n) {
    if (!n.read) {
      await api.markNotificationRead(n.id).catch(() => {});
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (n.conversationId && n.fromUser) {
      onOpenChat?.({ conversationId: n.conversationId, recipient: n.fromUser });
    }
    setMenuOpen(false);
  }

  return (
    <RadixDropdown.Root open={menuOpen} onOpenChange={(o) => (setMenuOpen(o), o && refresh())}>
      <RadixDropdown.Trigger
        className="relative inline-flex size-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-canvas hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        aria-label="Notifications"
      >
        <Bell className="size-[18px]" strokeWidth={2.25} aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </RadixDropdown.Trigger>
      <RadixDropdown.Portal>
        <RadixDropdown.Content
          align="end"
          sideOffset={8}
          className="z-50 max-h-[70vh] w-[340px] overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-popover animate-menu-in focus:outline-none"
        >
          <div className="px-3 py-2 text-xs font-medium text-ink-soft/70">Notifications</div>
          {notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-ink-soft">You're all caught up.</div>
          ) : (
            notifications.map((n) => (
              <RadixDropdown.Item
                key={n.id}
                onSelect={() => handleSelect(n)}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors",
                  "data-[highlighted]:bg-canvas",
                  !n.read && "bg-accent-light/40"
                )}
              >
                <Avatar src={n.fromUser?.avatarUrl} alt={n.fromUser?.username} size="xs" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-ink">
                    <MessageCircle className="size-3 shrink-0 text-accent" aria-hidden />
                    <span className="font-medium">@{n.fromUser?.username}</span>
                    {n.postTitle && <span className="truncate text-ink-soft"> · {n.postTitle}</span>}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">{n.message}</p>
                  <p className="mt-0.5 text-[11px] text-ink-soft/60">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />}
              </RadixDropdown.Item>
            ))
          )}
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  );
}
