import { useState } from "react";
import { Bot, User, Copy, Check, Sparkles, Terminal } from "lucide-react";

export default function ChatMessage({ message, isLatest }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to format code blocks cleanly if present in markdown format ```lang ... ```
  const renderFormattedContent = (text) => {
    if (!text) return null;

    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        });
      }

      parts.push({
        type: "code",
        language: match[1] || "code",
        code: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex),
      });
    }

    if (parts.length === 0) {
      return <p className="msg-paragraph">{text}</p>;
    }

    return parts.map((part, index) => {
      if (part.type === "text") {
        return (
          <p key={index} className="msg-paragraph">
            {part.content}
          </p>
        );
      }

      return (
        <div key={index} className="code-block-container">
          <div className="code-block-header">
            <span className="code-lang">
              <Terminal size={13} /> {part.language}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(part.code);
              }}
              className="code-copy-btn"
              title="Copy code"
            >
              <Copy size={13} /> Copy code
            </button>
          </div>
          <pre className="code-block-content">
            <code>{part.code}</code>
          </pre>
        </div>
      );
    });
  };

  return (
    <div className={`chat-message-row ${isUser ? "user-row" : "assistant-row"}`}>
      <div className="message-wrapper">
        <div className={`msg-avatar ${isUser ? "user-avatar" : "ai-avatar"}`}>
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>

        <div className="msg-bubble">
          <div className="msg-header">
            <span className="msg-sender-name">
              {isUser ? "You" : "Atlas AI"}
            </span>
            {!isUser && (
              <span className="ai-badge">
                <Sparkles size={11} /> OpenAI
              </span>
            )}
            <span className="msg-time">
              {message.createdAt
                ? new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Just now"}
            </span>
          </div>

          <div className="msg-content">
            {renderFormattedContent(message.content)}
          </div>

          <div className="msg-actions">
            <button
              onClick={handleCopy}
              className="msg-action-btn"
              title="Copy message"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-success" /> Copied
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
