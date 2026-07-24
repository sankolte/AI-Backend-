const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function fetchWithAuth(url, token, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export async function fetchChats(token, { page = 1, limit = 20 } = {}) {
  return fetchWithAuth(`/api/v1/chats?page=${page}&limit=${limit}`, token);
}

export async function createChat(token, { title } = {}) {
  return fetchWithAuth(`/api/v1/chats`, token, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function fetchChatById(token, chatId) {
  return fetchWithAuth(`/api/v1/chats/${chatId}`, token);
}

export async function renameChat(token, chatId, title) {
  return fetchWithAuth(`/api/v1/chats/${chatId}`, token, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function deleteChat(token, chatId) {
  return fetchWithAuth(`/api/v1/chats/${chatId}`, token, {
    method: "DELETE",
  });
}

export async function sendMessage(token, chatId, { role = "user", content }) {
  return fetchWithAuth(`/api/v1/chats/${chatId}/messages`, token, {
    method: "POST",
    body: JSON.stringify({ role, content }),
  });
}

export async function fetchMessages(token, chatId, { limit = 50, cursor } = {}) {
  let url = `/api/v1/chats/${chatId}/messages?limit=${limit}`;
  if (cursor) url += `&cursor=${cursor}`;
  return fetchWithAuth(url, token);
}
