"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Sparkles, Send, AlertCircle, MessageCircle } from "lucide-react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";

const POLL_INTERVAL_MS = 5000;

/**
 * Merges `incoming` messages into `prev`, de-duplicated by id and sorted by
 * time. Returns the SAME array reference when nothing actually changed, so
 * a poll tick that only re-confirms messages we already have triggers no
 * re-render (this is what stops the "same message flashes back in every
 * few seconds" bug — polling used to blindly concat every response).
 */
function mergeMessages(prev, incoming) {
  if (!incoming || incoming.length === 0) return prev;
  let changed = false;
  const byId = new Map(prev.map((m) => [m.id, m]));
  for (const m of incoming) {
    if (!byId.has(m.id)) changed = true;
    byId.set(m.id, m);
  }
  if (!changed) return prev;
  return Array.from(byId.values()).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/**
 * A chat dialog. Two modes, picked automatically:
 *  - `conversationId` is null  -> compose the opening message to `recipient`
 *  - `conversationId` is set   -> the thread, auto-refreshing via polling
 *
 * Polling is plain REST (`GET /api/conversations/:id/messages?after=...`)
 * on an interval — no websocket — per the brief.
 */
export default function ChatWindow({
  open,
  onOpenChange,
  recipient,
  postId = null,
  currentUserId,
  initialConversationId = null,
}) {
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [improving, setImproving] = useState(false);
  const [err, setErr] = useState(null);
  const scrollRef = useRef(null);
  const lastCreatedAtRef = useRef(null);
  const prevKeyRef = useRef(undefined);
  // Messages sent from this tab this session — rendered as "mine" instantly,
  // without waiting on `currentUserId` to be confirmed by the server. This
  // is what stops the sent bubble briefly rendering gray before flipping blue.
  const sentIdsRef = useRef(new Set());

  // Only reset local state when the *target* actually changes (a different
  // conversation, or composing to a different person) — not on every
  // open/close of the dialog. The component stays mounted the whole time
  // (ChatProvider always renders it), so without this guard, reopening the
  // very same thread wiped it back to empty every time.
  useEffect(() => {
    const key = initialConversationId || recipient?.id || null;
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;
    setConversationId(initialConversationId);
    setMessages([]);
    setDraft("");
    setErr(null);
    lastCreatedAtRef.current = null;
    sentIdsRef.current = new Set();
  }, [initialConversationId, recipient?.id]);

  const loadInitialMessages = useCallback(async (id) => {
    try {
      const { messages: msgs } = await api.getMessages(id);
      setMessages((prev) => {
        const merged = mergeMessages(prev, msgs);
        lastCreatedAtRef.current = merged.length ? merged[merged.length - 1].createdAt : lastCreatedAtRef.current;
        return merged;
      });
    } catch {
      /* ignore — polling will retry */
    }
  }, []);

  useEffect(() => {
    if (!open || !conversationId) return;
    loadInitialMessages(conversationId);
  }, [open, conversationId, loadInitialMessages]);

  // Auto-refresh: poll for new messages every few seconds while the window is open.
  useEffect(() => {
    if (!open || !conversationId) return;
    const interval = setInterval(async () => {
      try {
        const { messages: fresh } = await api.getMessages(conversationId, lastCreatedAtRef.current || undefined);
        setMessages((prev) => {
          const merged = mergeMessages(prev, fresh);
          if (merged !== prev) {
            lastCreatedAtRef.current = merged[merged.length - 1].createdAt;
          }
          return merged;
        });
      } catch {
        /* silent — try again next tick */
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [open, conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleImprove() {
    if (!draft.trim()) return;
    setImproving(true);
    setErr(null);
    try {
      const { improved } = await api.improveMessage(draft);
      setDraft(improved);
    } catch (e) {
      setErr(e.message);
    } finally {
      setImproving(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    setErr(null);
    try {
      if (!conversationId) {
        const { conversationId: newId, message } = await api.startConversation(recipient.id, draft, postId);
        sentIdsRef.current.add(message.id);
        setConversationId(newId);
        setMessages((prev) => {
          const merged = mergeMessages(prev, [message]);
          lastCreatedAtRef.current = merged[merged.length - 1].createdAt;
          return merged;
        });
      } else {
        const { message } = await api.sendMessage(conversationId, draft);
        sentIdsRef.current.add(message.id);
        setMessages((prev) => {
          const merged = mergeMessages(prev, [message]);
          lastCreatedAtRef.current = merged[merged.length - 1].createdAt;
          return merged;
        });
      }
      setDraft("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />
        <RadixDialog.Content
          className="fixed left-1/2 top-1/2 z-50 flex h-[min(640px,85vh)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-surface shadow-popover focus:outline-none data-[state=open]:animate-content-in data-[state=closed]:animate-content-out"
          aria-describedby={undefined}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface/95 px-5 py-3.5 backdrop-blur">
            <div className="flex items-center gap-2.5">
              <Avatar src={recipient?.avatarUrl} alt={recipient?.username} size="sm" />
              <div>
                <RadixDialog.Title className="font-display text-sm font-semibold text-ink">
                  @{recipient?.username}
                </RadixDialog.Title>
                <p className="text-xs text-ink-soft">
                  {conversationId ? "Chat updates automatically" : "Send a message to get started"}
                </p>
              </div>
            </div>
            <RadixDialog.Close asChild>
              <button
                aria-label="Close"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            </RadixDialog.Close>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-ink-soft/70">
                <MessageCircle className="mb-2 size-8" strokeWidth={1.5} aria-hidden />
                <p className="text-sm">No messages yet — say hello.</p>
              </div>
            ) : (
              messages.map((m) => {
                const mine = sentIdsRef.current.has(m.id) || m.senderId === currentUserId;
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                        mine ? "rounded-br-sm bg-accent text-white" : "rounded-bl-sm bg-canvas text-ink"
                      )}
                    >
                      {m.body}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSend} className="shrink-0 border-t border-border px-4 py-3">
            {err && (
              <div className="mb-2 flex items-start gap-2 rounded-lg bg-danger-light px-3 py-2 text-xs text-danger">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>{err}</span>
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                rows={2}
                placeholder="Write a professional message…"
                className="flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-accent focus:outline-none"
              />
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={handleImprove}
                  disabled={improving || !draft.trim()}
                  title="Upgrade with AI"
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-accent transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Sparkles className={cn("size-4", improving && "animate-pulse")} aria-hidden />
                </button>
                <Button type="submit" size="sm" className="!h-9 !w-9 !px-0" loading={sending} aria-label="Send">
                  {!sending && <Send className="size-4" aria-hidden />}
                </Button>
              </div>
            </div>
          </form>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
