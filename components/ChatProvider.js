"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import ChatWindow from "./ChatWindow";
import { api } from "@/lib/api";

const ChatContext = createContext(null);

export function useChat() {
  return useContext(ChatContext);
}

/**
 * Mounts one ChatWindow for the whole app. Anything (the message icon on a
 * post, a profile's message button, a notification) calls `openChat` with
 * either a `recipient` (to start a new thread) or a `conversationId` (to
 * reopen an existing one).
 */
export default function ChatProvider({ children }) {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [state, setState] = useState({ open: false, recipient: null, postId: null, conversationId: null });

  useEffect(() => {
    api
      .me()
      .then((u) => setCurrentUserId(u.id))
      .catch(() => setCurrentUserId(null));
  }, []);

  const openChat = useCallback(({ recipient, postId = null, conversationId = null }) => {
    setState({ open: true, recipient, postId, conversationId });
  }, []);

  // Used by the "Message" button on a post/profile page — looks up
  // whether a thread with this person already exists so we reopen it
  // (with history) instead of always starting a blank compose box.
  const openChatWithUser = useCallback(async (recipient, postId = null) => {
    setState({ open: true, recipient, postId, conversationId: null });
    try {
      const { conversation } = await api.getConversationWithUser(recipient.id);
      if (conversation) {
        setState({ open: true, recipient, postId, conversationId: conversation.id });
      }
    } catch {
      /* not logged in, or a transient error — compose mode is still fine */
    }
  }, []);

  const closeChat = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  return (
    <ChatContext.Provider value={{ openChat, openChatWithUser, closeChat, currentUserId }}>
      {children}
      <ChatWindow
        open={state.open}
        onOpenChange={(open) => setState((s) => ({ ...s, open }))}
        recipient={state.recipient}
        postId={state.postId}
        initialConversationId={state.conversationId}
        currentUserId={currentUserId}
      />
    </ChatContext.Provider>
  );
}
