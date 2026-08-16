// Thin fetch wrapper for the web app. Cookies (`credentials: "include"`)
// carry the session automatically here — a React Native or Flutter client
// would instead pass `Authorization: Bearer <accessToken>` and hit the
// exact same /api/* routes.
async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 && !options._retried) {
    // access token cookie expired — try a silent refresh once
    const refreshed = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
    if (refreshed.ok) {
      return request(path, { ...options, _retried: true });
    }
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  me: () => request("/api/auth/me"),
  logout: () => request("/api/auth/logout", { method: "POST" }),

  getFeed: (category, cursor, q) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (cursor) params.set("cursor", cursor);
    if (q) params.set("q", q);
    const qs = params.toString();
    return request(`/api/posts${qs ? `?${qs}` : ""}`);
  },
  getPost: (id) => request(`/api/posts/${id}`),
  createPost: (data) => request("/api/posts", { method: "POST", body: JSON.stringify(data) }),
  updatePost: (id, data) => request(`/api/posts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePost: (id) => request(`/api/posts/${id}`, { method: "DELETE" }),

  toggleLike: (id) => request(`/api/posts/${id}/like`, { method: "POST" }),
  toggleSave: (id) => request(`/api/posts/${id}/save`, { method: "POST" }),
  getSaved: () => request("/api/saved"),

  getUser: (id) => request(`/api/users/${id}`),
  updateUser: (id, data) => request(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getUserPosts: (id, cursor) =>
    request(`/api/users/${id}/posts${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`),

  improveDescription: (description) =>
    request("/api/ai/improve-description", { method: "POST", body: JSON.stringify({ description }) }),
  improveMessage: (text) =>
    request("/api/ai/improve-message", { method: "POST", body: JSON.stringify({ text }) }),

  // Messaging / notifications
  getConversations: (cursor) => request(`/api/conversations${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`),
  getConversationWithUser: (userId) => request(`/api/conversations?withUserId=${encodeURIComponent(userId)}`),
  startConversation: (toUserId, message, postId) =>
    request("/api/conversations", { method: "POST", body: JSON.stringify({ toUserId, message, postId }) }),
  getMessages: (conversationId, after) =>
    request(`/api/conversations/${conversationId}/messages${after ? `?after=${encodeURIComponent(after)}` : ""}`),
  sendMessage: (conversationId, body) =>
    request(`/api/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ body }) }),

  getNotifications: () => request("/api/notifications"),
  markNotificationRead: (id) => request("/api/notifications", { method: "POST", body: JSON.stringify({ id }) }),
  markAllNotificationsRead: () => request("/api/notifications", { method: "POST", body: JSON.stringify({ all: true }) }),
};
