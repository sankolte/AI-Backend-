import { useState } from "react";
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";

export default function ChatSidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  isCollapsed,
  onToggleCollapse,
  loading,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const filteredChats = chats.filter((chat) =>
    (chat.title || "New Conversation")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const startRename = (chat, e) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title || "New Conversation");
  };

  const saveRename = (chatId, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const cancelRename = (e) => {
    e.stopPropagation();
    setEditingChatId(null);
  };

  const handleDelete = (chatId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      onDeleteChat(chatId);
    }
  };

  if (isCollapsed) {
    return (
      <aside className="chat-sidebar collapsed">
        <button
          onClick={onToggleCollapse}
          className="sidebar-toggle-btn"
          title="Expand sidebar"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={onNewChat}
          className="icon-new-chat-btn"
          title="New Chat"
        >
          <Plus size={20} />
        </button>
        <div className="mini-chat-list">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`mini-chat-item ${
                activeChatId === chat.id ? "active" : ""
              }`}
              title={chat.title || "New Conversation"}
            >
              <MessageSquare size={16} />
            </button>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="chat-sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-badge">
            <Sparkles size={14} className="accent-icon" />
          </div>
          <span className="brand-title">Atlas Conversations</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="sidebar-toggle-btn"
          title="Collapse sidebar"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="sidebar-action-container">
        <button onClick={onNewChat} className="new-chat-btn">
          <Plus size={18} />
          <span>New Conversation</span>
          <span className="btn-kbd">⌘K</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="sidebar-search">
        <Search size={15} className="search-icon" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Chat List */}
      <div className="sidebar-chats-container">
        {loading ? (
          <div className="sidebar-loader">
            <div className="loader-sm" />
            <span>Loading conversations...</span>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="sidebar-empty">
            <MessageSquare size={24} className="empty-icon" />
            <p>No conversations yet</p>
          </div>
        ) : (
          <div className="chat-list">
            {filteredChats.map((chat) => {
              const isActive = activeChatId === chat.id;
              const isEditing = editingChatId === chat.id;
              const messageCount = chat._count?.messages || 0;

              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`chat-item ${isActive ? "active" : ""}`}
                >
                  <MessageSquare size={16} className="chat-item-icon" />

                  {isEditing ? (
                    <div className="inline-rename-box">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename(chat.id, e);
                          if (e.key === "Escape") cancelRename(e);
                        }}
                        className="rename-input"
                      />
                      <button
                        onClick={(e) => saveRename(chat.id, e)}
                        className="rename-save-btn"
                      >
                        <Check size={14} />
                      </button>
                      <button onClick={cancelRename} className="rename-cancel-btn">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="chat-item-info">
                        <span className="chat-title" title={chat.title}>
                          {chat.title || "New Conversation"}
                        </span>
                        {messageCount > 0 && (
                          <span className="chat-msg-count">
                            {messageCount} {messageCount === 1 ? "msg" : "msgs"}
                          </span>
                        )}
                      </div>

                      <div className="chat-item-actions">
                        <button
                          onClick={(e) => startRename(chat, e)}
                          className="item-action-btn"
                          title="Rename"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(chat.id, e)}
                          className="item-action-btn delete-btn"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="sidebar-footer">
        <div className="system-status">
          <Zap size={14} className="status-bolt" />
          <span>Atlas AI • OpenAI Ready</span>
        </div>
      </div>
    </aside>
  );
}
