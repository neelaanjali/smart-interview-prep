import { useEffect, useRef, useState } from "react";
import { authedFetch } from "../../api/authedFetch";

function AskAITab({ contextInterview, onClearContext }) {
  const getInitialMessages = (interview) => [
    interview
      ? {
          role: "ai",
          text: `I'm ready to help you prep for your ${interview.title} interview! You can ask me anything - mock questions, what to expect, company culture, technical topics, or how to answer specific questions. What do you want to work on?`,
        }
      : {
          role: "ai",
          text: "Hey! I'm your interview prep assistant powered by Gemini. Ask me anything - practice questions, feedback on your answers, resume tips, or how to prep for a specific company.",
        },
  ];

  const [messages, setMessages] = useState(() =>
    getInitialMessages(contextInterview),
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentContext, setCurrentContext] = useState(
    contextInterview || null,
  );
  const bottomRef = useRef(null);

  useEffect(() => {
    if (contextInterview && contextInterview?.title !== currentContext?.title) {
      setCurrentContext(contextInterview);
      setMessages(getInitialMessages(contextInterview));
    }
  }, [contextInterview, currentContext?.title]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startFresh = () => {
    setCurrentContext(null);
    setMessages(getInitialMessages(null));
    if (onClearContext) onClearContext();
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await authedFetch("/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          context: currentContext
            ? `The user is preparing for: ${currentContext.title}`
            : null,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.reply || "Sorry, I couldn't get a response. Try again.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Something went wrong connecting to the AI. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 280px",
        gap: "1.5rem",
        height: "calc(100vh - 180px)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: "white",
          borderRadius: "14px",
          border: "1.5px solid #f1f5f9",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "#1e293b",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              flexShrink: 0,
            }}
          >
            🤖
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontWeight: "700",
                fontSize: "0.9rem",
                color: "#1e293b",
              }}
            >
              Interview AI
            </p>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "#94a3b8" }}>
              {currentContext
                ? `Context: ${currentContext.title}`
                : "General interview prep · Powered by Gemini"}
            </p>
          </div>
          {currentContext && (
            <button
              onClick={startFresh}
              style={{
                padding: "5px 12px",
                background: "#f8fafc",
                color: "#64748b",
                border: "1.5px solid #e2e8f0",
                borderRadius: "7px",
                fontSize: "0.75rem",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              + New chat
            </button>
          )}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.25rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {currentContext && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1.5px solid #bbf7d0",
                borderRadius: "10px",
                padding: "0.65rem 1rem",
                fontSize: "0.78rem",
                color: "#166534",
                fontWeight: "500",
              }}
            >
              📚 Continuing from your study session on{" "}
              <strong>{currentContext.title}</strong>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "0.75rem 1rem",
                  borderRadius:
                    msg.role === "user"
                      ? "14px 14px 4px 14px"
                      : "14px 14px 14px 4px",
                  background: msg.role === "user" ? "#1e293b" : "#f8fafc",
                  color: msg.role === "user" ? "white" : "#334155",
                  fontSize: "0.85rem",
                  lineHeight: 1.6,
                  border: msg.role === "ai" ? "1.5px solid #f1f5f9" : "none",
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "14px 14px 14px 4px",
                  background: "#f8fafc",
                  border: "1.5px solid #f1f5f9",
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                }}
              >
                Thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            gap: "0.75rem",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={
              currentContext
                ? `Ask about your ${currentContext.title.split("-")[0].trim()} interview...`
                : "Ask anything about your interview prep..."
            }
            style={{
              flex: 1,
              padding: "0.65rem 1rem",
              border: "1.5px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "0.85rem",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              padding: "0.65rem 1.25rem",
              background: "#1e293b",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "0.85rem",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              opacity: loading || !input.trim() ? 0.5 : 1,
              fontFamily: "inherit",
            }}
          >
            Send
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div
          style={{
            background: "#1e293b",
            borderRadius: "14px",
            padding: "1.25rem",
            color: "white",
          }}
        >
          <p
            style={{
              margin: "0 0 0.25rem",
              fontSize: "0.7rem",
              fontWeight: "700",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#94a3b8",
            }}
          >
            Ask AI
          </p>
          <p style={{ margin: 0, fontWeight: "700", fontSize: "1rem" }}>
            Your Interview Coach
          </p>
          <p
            style={{
              margin: "0.5rem 0 0",
              fontSize: "0.8rem",
              color: "#94a3b8",
              lineHeight: 1.6,
            }}
          >
            Powered by Gemini. Ask about any role, company, or question type.
          </p>
        </div>

        {currentContext && (
          <button
            onClick={startFresh}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "white",
              border: "1.5px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "0.82rem",
              fontWeight: "600",
              color: "#334155",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>✏️</span> Start a fresh chat
          </button>
        )}

        <div
          style={{
            background: "white",
            borderRadius: "14px",
            padding: "1.25rem",
            border: "1.5px solid #f1f5f9",
          }}
        >
          <p
            style={{
              margin: "0 0 0.75rem",
              fontSize: "0.75rem",
              fontWeight: "700",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Try asking...
          </p>
          {(currentContext
            ? [
                `What does ${currentContext.title.split("-")[0].trim()} look for in candidates?`,
                "Give me a mock behavioral question",
                "What are the hardest questions I might face?",
                "How should I answer 'Tell me about yourself'?",
                "What technical topics should I review?",
              ]
            : [
                "Give me a mock behavioral interview",
                "What are common system design questions?",
                "Help me prep for a Google SWE interview",
                "Review my answer: Tell me about yourself",
                "What should I research before an interview?",
              ]
          ).map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "0.6rem 0.75rem",
                marginBottom: "0.5rem",
                background: "#f8fafc",
                border: "1.5px solid #f1f5f9",
                borderRadius: "8px",
                fontSize: "0.78rem",
                color: "#334155",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: "500",
                lineHeight: 1.4,
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AskAITab;
