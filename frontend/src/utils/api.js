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

export async function streamMessage(token, chatId, content, { onChunk, onDone, onError, onUserMessage, model = "gpt-4o-mini" } = {}) {
  try {
    const res = await fetch(`${API_URL}/api/v1/chats/${chatId}/messages/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, model }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Request failed with status ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const dataStr = trimmed.replace(/^data:\s*/, "");
        if (dataStr === "[DONE]") {
          if (onDone) onDone();
          return;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.type === "user_message") {
            if (onUserMessage) onUserMessage(parsed.data);
          } else if (parsed.type === "chunk") {
            if (onChunk) onChunk(parsed.content);
          } else if (parsed.type === "done") {
            if (onDone) onDone(parsed.data);
          } else if (parsed.type === "error") {
            if (onError) onError(new Error(parsed.message));
          }
        } catch (e) {
          console.error("Failed to parse SSE JSON chunk:", e);
        }
      }
    }
    if (onDone) onDone();
  } catch (err) {
    if (onError) onError(err);
  }
}

