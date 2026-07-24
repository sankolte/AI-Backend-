import { useState, useRef, useEffect } from "react";
import { Paperclip, Sparkles, ArrowUp } from "lucide-react";

export default function ChatInput({ onSendMessage, disabled, isSending }) {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || disabled || isSending) return;
    onSendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-input-wrapper">
      <form onSubmit={handleSubmit} className="chat-input-box">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Atlas AI anything... (Shift+Enter for new line)"
          disabled={disabled}
          rows={1}
          className="chat-textarea"
        />

        <div className="input-toolbar">
          <div className="toolbar-left">
            <button
              type="button"
              className="toolbar-icon-btn"
              title="Attach context file (mock)"
            >
              <Paperclip size={16} />
            </button>
            <span className="input-hint">
              <Sparkles size={12} className="sparkle-gold" /> Saved to Postgres DB
            </span>
          </div>

          <div className="toolbar-right">
            <button
              type="submit"
              disabled={!input.trim() || disabled || isSending}
              className={`send-btn ${input.trim() ? "active" : ""}`}
              title="Send Message (Enter)"
            >
              {isSending ? (
                <div className="send-spinner" />
              ) : (
                <ArrowUp size={18} />
              )}
            </button>
          </div>
        </div>
      </form>
      <div className="input-disclaimer">
        Atlas AI can make mistakes. All conversations are stored on your server.
      </div>
    </div>
  );
}
