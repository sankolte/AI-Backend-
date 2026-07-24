import { useState } from "react";
import {
  Edit3,
  Check,
  Trash2,
  Cpu,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function ChatHeader({
  activeChat,
  onRenameChat,
  onDeleteChat,
  selectedModel,
  onSelectModel,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(activeChat?.title || "New Conversation");

  const openAiModels = [
    { id: "gpt-4o", name: "GPT-4o (Omni)", desc: "High Intelligence" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", desc: "Fast & Lightweight" },
    { id: "o3-mini", name: "o3-Mini", desc: "STEM & Code Reasoning" },
    { id: "o1", name: "o1", desc: "Advanced Reasoning" },
  ];

  const handleSaveTitle = () => {
    if (activeChat && title.trim() && title !== activeChat.title) {
      onRenameChat(activeChat.id, title.trim());
    }
    setIsEditing(false);
  };

  return (
    <header className="chat-workspace-header">
      <div className="header-left">
        {activeChat ? (
          isEditing ? (
            <div className="header-title-edit">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                autoFocus
                className="header-title-input"
              />
              <button onClick={handleSaveTitle} className="header-save-btn">
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div
              className="header-title-group"
              onClick={() => {
                setTitle(activeChat.title || "New Conversation");
                setIsEditing(true);
              }}
              title="Click to rename"
            >
              <h2 className="header-title">{activeChat.title || "New Conversation"}</h2>
              <Edit3 size={14} className="edit-icon-hint" />
            </div>
          )
        ) : (
          <div className="header-title-group">
            <h2 className="header-title">Atlas AI</h2>
          </div>
        )}
      </div>

      <div className="header-right">
        {/* OpenAI Model Selector Selector */}
        <div className="model-selector-dropdown">
          <Cpu size={14} className="model-icon" />
          <select
            value={selectedModel}
            onChange={(e) => onSelectModel(e.target.value)}
            className="model-select"
          >
            {openAiModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Backend Connected Indicator */}
        <div className="backend-indicator" title="Connected to Express /api/v1/chats">
          <ShieldCheck size={14} className="shield-icon" />
          <span>Postgres Sync</span>
        </div>

        {/* Delete Chat Button */}
        {activeChat && (
          <button
            onClick={() => {
              if (
                window.confirm("Are you sure you want to delete this conversation?")
              ) {
                onDeleteChat(activeChat.id);
              }
            }}
            className="header-icon-btn danger"
            title="Delete conversation"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
