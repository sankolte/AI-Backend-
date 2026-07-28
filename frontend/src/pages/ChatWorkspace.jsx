import { useState, useEffect, useRef, useCallback } from "react";
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
  streamMessage,
} from "../utils/api";
import { Bot, AlertCircle } from "lucide-react";

export default function ChatWorkspace() {
  const { user } = useUser();
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
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
  const sendingChatIdRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Sync activeChatId state with URL parameters
  useEffect(() => {
    if (urlChatId) {
      setActiveChatId(urlChatId);
      localStorage.setItem("lastActiveChatId", urlChatId);
    } else {
      setActiveChatId(null);
    }
  }, [urlChatId]);

  // Fetch all conversations belonging to the user ONCE when authentication is ready
  const loadUserChats = useCallback(async () => {
    if (!isAuthLoaded || !isSignedIn) {
      return;
    }
    setLoadingChats(true);
    setError(null);
    try {
      let token = await getToken();
      if (!token) {
        // Wait briefly for Clerk session token hydration
        await new Promise((r) => setTimeout(r, 400));
        token = await getToken();
      }
      if (!token) {
        console.warn("[loadUserChats] No token received from Clerk after retry.");
        return;
      }

      const data = await fetchChats(token, { limit: 50 });
      const fetchedChats = data.chats || [];
      setChats(fetchedChats);
    } catch (err) {
      console.error("Error loading chats:", err);
      setError(err.message || "Failed to load conversations.");
    } finally {
      setLoadingChats(false);
    }
  }, [isAuthLoaded, isSignedIn, getToken]);

  useEffect(() => {
    loadUserChats();
  }, [isAuthLoaded, isSignedIn, loadUserChats]);

  // Load messages for the currently active chat ID
  const loadChatMessages = useCallback(
    async (chatId) => {
      if (!isAuthLoaded || !isSignedIn || !chatId) return;

      // Skip fetching if currently streaming/sending messages for this exact chat
      if (sendingChatIdRef.current === chatId) {
        return;
      }

      setLoadingMessages(true);
      setError(null);
      try {
        let token = await getToken();
        if (!token) {
          await new Promise((r) => setTimeout(r, 400));
          token = await getToken();
        }
        if (!token) return;

        const chat = await fetchChatById(token, chatId);
        if (sendingChatIdRef.current !== chatId) {
          setMessages(chat.messages || []);
        }
      } catch (err) {
        console.error("Error loading chat messages:", err);
        setError(err.message || "Could not fetch messages for this conversation.");
      } finally {
        setLoadingMessages(false);
      }
    },
    [isAuthLoaded, isSignedIn, getToken]
  );

  useEffect(() => {
    if (activeChatId) {
      loadChatMessages(activeChatId);
    } else {
      setMessages([]);
    }
  }, [activeChatId, loadChatMessages]);

  // Start a new blank conversation
  const handleNewChat = () => {
    setError(null);
    sendingChatIdRef.current = null;
    setActiveChatId(null);
    setMessages([]);
    navigate("/dashboard");
  };

  // Select an existing conversation from the side panel
  const handleSelectChat = (chatId) => {
    if (chatId === activeChatId) return;
    setError(null);
    sendingChatIdRef.current = null;
    setActiveChatId(chatId);
    localStorage.setItem("lastActiveChatId", chatId);
    navigate(`/dashboard/${chatId}`);
  };

  // Rename a conversation title
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

  // Delete a conversation
  const handleDeleteChat = async (chatId) => {
    try {
      const token = await getToken();
      await deleteChat(token, chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) {
        localStorage.removeItem("lastActiveChatId");
        sendingChatIdRef.current = null;
        setActiveChatId(null);
        setMessages([]);
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Error deleting chat:", err);
      setError("Failed to delete conversation.");
    }
  };

  // Send message and stream AI response via SSE
  const handleSendMessage = async (promptText) => {
    if (!promptText.trim() || isSending) return;

    setError(null);
    let targetChatId = activeChatId;

    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication session expired. Please sign in again.");
        return;
      }

      // 1. Create a new conversation in backend if none is active
      if (!targetChatId) {
        const titleSnippet =
          promptText.length > 35 ? `${promptText.slice(0, 35)}...` : promptText;
        const createRes = await createChat(token, { title: titleSnippet });
        const newChatObj = createRes.chat || createRes;

        const chatWithMeta = {
          ...newChatObj,
          _count: { messages: 0 },
        };

        targetChatId = chatWithMeta.id;
        sendingChatIdRef.current = targetChatId;
        setActiveChatId(targetChatId);

        // Prepend new conversation to sidebar list immediately
        setChats((prev) => [chatWithMeta, ...prev.filter((c) => c.id !== targetChatId)]);
        localStorage.setItem("lastActiveChatId", targetChatId);
        navigate(`/dashboard/${targetChatId}`, { replace: true });
      } else {
        sendingChatIdRef.current = targetChatId;
      }

      setIsSending(true);

      const tempUserMsgId = `user-${Date.now()}`;
      const tempAiMsgId = `ai-${Date.now()}`;

      // Optimistically insert user message and empty assistant response box into UI state
      setMessages((prev) => [
        ...prev,
        { id: tempUserMsgId, role: "user", content: promptText, createdAt: new Date().toISOString() },
        { id: tempAiMsgId, role: "assistant", content: "", createdAt: new Date().toISOString() },
      ]);

      // Call streaming backend SSE endpoint
      await streamMessage(token, targetChatId, promptText, {
        model: selectedModel,
        onUserMessage: (userMsg) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === tempUserMsgId ? userMsg : msg))
          );
        },
        onChunk: (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAiMsgId ? { ...msg, content: msg.content + chunk } : msg
            )
          );
        },
        onDone: (finalAiMsg) => {
          if (finalAiMsg) {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === tempAiMsgId ? finalAiMsg : msg))
            );
          }
          setIsSending(false);
          sendingChatIdRef.current = null;

          // Update sidebar list: move active chat to top and update message count
          setChats((prev) => {
            const chatIdx = prev.findIndex((c) => c.id === targetChatId);
            if (chatIdx < 0) return prev;
            const updated = {
              ...prev[chatIdx],
              updatedAt: new Date().toISOString(),
              _count: { messages: (prev[chatIdx]._count?.messages || 0) + 2 },
            };
            const rest = prev.filter((c) => c.id !== targetChatId);
            return [updated, ...rest];
          });
        },
        onError: (err) => {
          console.error("Streaming error:", err);
          setError(err.message || "Error streaming response from AI.");
          setIsSending(false);
          sendingChatIdRef.current = null;
        },
      });
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message to server.");
      setIsSending(false);
      sendingChatIdRef.current = null;
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
