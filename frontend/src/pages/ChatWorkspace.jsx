import { useState, useEffect, useRef } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useParams, useNavigate } from "react-router-dom";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatHeader from "../components/chat/ChatHeader";
import ChatMessage from "../components/chat/ChatMessage";
import ChatInput from "../components/chat/ChatInput";
import PromptStarters from "../components/chat/PromptStarters";
import {
  fetchChats,
  createChat,
  fetchChatById,
  renameChat,
  deleteChat,
  sendMessage,
} from "../utils/api";
import { Bot, AlertCircle } from "lucide-react";

export default function ChatWorkspace() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { chatId: urlChatId } = useParams();

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(urlChatId || null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Load all chats on mount
  useEffect(() => {
    loadUserChats();
  }, []);

  // Synchronize activeChatId with URL or select first chat if needed
  useEffect(() => {
    if (urlChatId) {
      setActiveChatId(urlChatId);
    }
  }, [urlChatId]);

  // Load active chat details & messages whenever activeChatId changes
  useEffect(() => {
    if (activeChatId) {
      loadChatMessages(activeChatId);
    } else {
      setMessages([]);
    }
  }, [activeChatId]);

  const loadUserChats = async () => {
    setLoadingChats(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await fetchChats(token, { limit: 50 });
      setChats(data.chats || []);
    } catch (err) {
      console.error("Error loading chats:", err);
      setError("Could not connect to backend server. Make sure node src/server.js is running.");
    } finally {
      setLoadingChats(false);
    }
  };

  const loadChatMessages = async (chatId) => {
    setLoadingMessages(true);
    try {
      const token = await getToken();
      const chat = await fetchChatById(token, chatId);
      setMessages(chat.messages || []);
    } catch (err) {
      console.error("Error loading chat messages:", err);
      setError("Could not fetch messages for this conversation.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleNewChat = async () => {
    setError(null);
    try {
      const token = await getToken();
      const res = await createChat(token, { title: "New Conversation" });
      const newChatObj = res.chat || res;
      setChats((prev) => [newChatObj, ...prev]);
      setActiveChatId(newChatObj.id);
      setMessages([]);
    } catch (err) {
      console.error("Error creating chat:", err);
      setError("Failed to create new conversation.");
    }
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
  };

  const handleRenameChat = async (chatId, newTitle) => {
    try {
      const token = await getToken();
      const res = await renameChat(token, chatId, newTitle);
      const updatedChat = res.chat || res;
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, title: updatedChat.title } : c))
      );
    } catch (err) {
      console.error("Error renaming chat:", err);
      setError("Failed to rename conversation.");
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      const token = await getToken();
      await deleteChat(token, chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Error deleting chat:", err);
      setError("Failed to delete conversation.");
    }
  };

  // Generate OpenAI response simulation (until OpenAI API SDK is wired up)
  const generateAIResponse = (userPrompt, model) => {
    const promptLower = userPrompt.toLowerCase();

    if (promptLower.includes("express") || promptLower.includes("backend") || promptLower.includes("controller")) {
      return `Here is how Express Controller validation works in **Atlas AI** (${model}):

\`\`\`javascript
// Express controller using wrapAsync and Zod validation
import wrapAsync from "../utils/wrapAsync.js";
import { createChatService } from "../services/chat.service.js";

export const createChat = wrapAsync(async (req, res) => {
  const clerkId = req.clerkId;
  const chat = await createChatService(clerkId, req.body);
  res.status(201).json({ message: "Chat created successfully", chat });
});
\`\`\`

All requests are validated by Zod schemas and persisted directly into PostgreSQL via Prisma ORM!`;
    }

    if (promptLower.includes("openai") || promptLower.includes("sdk") || promptLower.includes("stream")) {
      return `To connect the official **OpenAI Node.js SDK** to Atlas AI, install \`openai\` and initialize it in your service:

\`\`\`javascript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getOpenAIStream(prompt) {
  const response = await openai.chat.completions.create({
    model: "${model}",
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });
  return response;
}
\`\`\`

Atlas is pre-configured with OpenAI model selection options (\`gpt-4o\`, \`gpt-4o-mini\`, \`o3-mini\`, \`o1\`)!`;
    }

    return `I have received your query via **Atlas AI** using model **${model}**:

> "${userPrompt}"

Your conversation and message data are persistently stored in your backend PostgreSQL database via \`/api/v1/chats\`.`;
  };

  const handleSendMessage = async (promptText) => {
    if (!promptText.trim() || isSending) return;

    setError(null);
    let targetChatId = activeChatId;

    try {
      const token = await getToken();

      // 1. Create a new conversation in backend if none is active
      if (!targetChatId) {
        const titleSnippet = promptText.length > 30 ? `${promptText.slice(0, 30)}...` : promptText;
        const createRes = await createChat(token, { title: titleSnippet });
        const newChatObj = createRes.chat || createRes;
        targetChatId = newChatObj.id;
        setActiveChatId(newChatObj.id);
        setChats((prev) => [newChatObj, ...prev]);
      }

      // 2. Post User Message to Backend DB
      const userMsgRes = await sendMessage(token, targetChatId, {
        role: "user",
        content: promptText,
      });

      const userMsgObj = userMsgRes.data || userMsgRes;
      setMessages((prev) => [...prev, userMsgObj]);
      setIsSending(true);

      // 3. Generate response & post Assistant Message to Backend DB
      setTimeout(async () => {
        try {
          const aiResponseText = generateAIResponse(promptText, selectedModel);

          const aiMsgRes = await sendMessage(token, targetChatId, {
            role: "assistant",
            content: aiResponseText,
          });

          const aiMsgObj = aiMsgRes.data || aiMsgRes;
          setMessages((prev) => [...prev, aiMsgObj]);

          // Update chat timestamp and count in sidebar
          setChats((prev) =>
            prev.map((c) =>
              c.id === targetChatId
                ? {
                    ...c,
                    updatedAt: new Date().toISOString(),
                    _count: { messages: (c._count?.messages || 0) + 2 },
                  }
                : c
            )
          );
        } catch (aiErr) {
          console.error("Error saving AI response:", aiErr);
          setError("Failed to save AI response.");
        } finally {
          setIsSending(false);
        }
      }, 1000);
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message to server.");
      setIsSending(false);
    }
  };

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="chat-workspace-page">
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        loading={loadingChats}
      />

      <main className="chat-main-area">
        <ChatHeader
          activeChat={activeChat}
          onRenameChat={handleRenameChat}
          onDeleteChat={handleDeleteChat}
          onNewChat={handleNewChat}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />

        {error && (
          <div className="workspace-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="error-close-btn">
              ×
            </button>
          </div>
        )}

        <div className="chat-feed-container">
          {loadingMessages ? (
            <div className="chat-feed-loader">
              <div className="loader" />
              <p>Fetching messages from backend...</p>
            </div>
          ) : messages.length === 0 ? (
            <PromptStarters
              onSelectPrompt={handleSendMessage}
              userName={user?.firstName}
            />
          ) : (
            <div className="messages-stream">
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id || idx}
                  message={msg}
                  isLatest={idx === messages.length - 1}
                />
              ))}

              {isSending && (
                <div className="chat-message-row assistant-row typing-row">
                  <div className="message-wrapper">
                    <div className="msg-avatar ai-avatar pulsing">
                      <Bot size={18} />
                    </div>
                    <div className="msg-bubble typing-bubble">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={loadingMessages}
          isSending={isSending}
        />
      </main>
    </div>
  );
}
