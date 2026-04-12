import { useEffect, useRef, useState } from "react";
import { authedFetch } from "../../api/authedFetch";

function StudyTab({ selectedInterview, pastInterviews, onGoToAskAI }) {
  const getInterviewKey = (interview) =>
    `${interview?.title || "untitled"}::${interview?.date || interview?.raw?.date || "nodate"}`;

  const getInterviewMeta = (interview) => {
    const raw = interview?.raw || {};
    const title = interview?.title || "Untitled Interview";
    const parts = title.split(/\s[–-]\s/);

    const company = raw.company || parts[0] || title;
    const role = raw.role || parts[1] || raw.type || "Interview";

    return {
      company,
      role,
      date: raw.date || interview?.date || "Upcoming",
      type: raw.type || "Interview",
    };
  };

  const [activeInterview, setActiveInterview] = useState(
    selectedInterview || null,
  );
  const [storedInterviews, setStoredInterviews] = useState([]);
  const [prepLibrary, setPrepLibrary] = useState({});
  const [streamedText, setStreamedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const bottomRef = useRef(null);
  const activePrepKey = activeInterview
    ? getInterviewKey(activeInterview)
    : null;
  const interviewList =
    storedInterviews.length > 0 ? storedInterviews : pastInterviews;

  useEffect(() => {
    const fetchStoredInterviews = async () => {
      try {
        const res = await authedFetch("/interviews");
        const data = await res.json();
        const interviews = Array.isArray(data.interviews)
          ? data.interviews
          : [];

        setStoredInterviews(interviews);

        setPrepLibrary((prev) => {
          const next = { ...prev };

          interviews.forEach((interview) => {
            const prepKey = getInterviewKey(interview);
            const storedContent = interview.content || interview.prepContent;

            if (storedContent) {
              next[prepKey] = {
                interview,
                meta: getInterviewMeta(interview),
                content: storedContent,
                generatedAt: interview.updatedAt || new Date().toISOString(),
              };
            }
          });

          return next;
        });
      } catch (error) {
        console.error("Failed to fetch stored interviews:", error);
      }
    };

    fetchStoredInterviews();
  }, []);

  const getFallbackContent = (
    title,
  ) => `Here is your personalized prep guide for your upcoming ${title} interview.

**About the Company & Role**
Start by deeply researching the company - their core products, business model, recent news, and what makes them unique in their industry. Understanding who they are and what they value will help you speak their language and show genuine interest.

**What They're Looking For**
Based on the role, they'll be evaluating your technical depth, problem-solving approach, and how you communicate under pressure. Strong candidates demonstrate not just what they did, but why they made specific decisions and what they learned from the outcomes.

**How to Structure Your Answers**
Use the STAR framework for behavioral questions: Situation (set the context briefly), Task (what was your responsibility), Action (what you specifically did - this should be the longest part), Result (quantify the outcome where possible). Keep each answer to 2-3 minutes.

**Key Topics to Review**
Depending on the round, be prepared to discuss your past projects in depth, walk through technical decisions, and handle ambiguous problem statements. Think about 3-5 strong stories from your experience that you can adapt to different question types.

**Questions to Ask Them**
Prepare thoughtful questions that show you've done your homework. Ask about what the team is currently working on, what a successful first 90 days looks like, and what challenges the role is trying to solve. Avoid asking things easily found on their website.

**Final Preparation**
The night before: review your key stories, get good rest, and prepare your setup if it's virtual. Day of: arrive or log in early, have water nearby, and remember - it's a two-way conversation. You're evaluating them too.`;

  useEffect(() => {
    if (!activeInterview) return;

    const prepKey = getInterviewKey(activeInterview);
    const existingPrep = prepLibrary[prepKey];

    if (existingPrep?.content) return;

    const generatePrep = async () => {
      setStreamedText("");
      setDone(false);
      setLoading(true);

      const streamAndStore = (fullText) => {
        setLoading(false);
        let i = 0;
        const interval = setInterval(() => {
          i += 6;
          setStreamedText(fullText.slice(0, i));
          if (i >= fullText.length) {
            setStreamedText(fullText);
            setDone(true);
            setPrepLibrary((prev) => ({
              ...prev,
              [prepKey]: {
                interview: activeInterview,
                meta: getInterviewMeta(activeInterview),
                content: fullText,
                generatedAt: new Date().toISOString(),
              },
            }));
            clearInterval(interval);
          }
        }, 16);
      };

      try {
        const res = await authedFetch("/ai/study", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interview: activeInterview.title }),
        });
        const data = await res.json();
        const fullText =
          data.content || getFallbackContent(activeInterview.title);
        streamAndStore(fullText);
      } catch {
        streamAndStore(getFallbackContent(activeInterview.title));
      }
    };

    generatePrep();
  }, [activeInterview, prepLibrary]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamedText]);

  const handleSelectInterview = (interview) => {
    const prepKey = getInterviewKey(interview);
    const existingPrep = prepLibrary[prepKey];
    const storedContent = interview.content || interview.prepContent;

    setActiveInterview(interview);

    if (existingPrep?.content) {
      setStreamedText(existingPrep.content);
      setDone(true);
      setLoading(false);
      return;
    }

    if (storedContent) {
      setStreamedText(storedContent);
      setDone(true);
      setLoading(false);
    }
  };

  const renderFormattedText = (text) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p
            key={i}
            style={{
              margin: "1.25rem 0 0.4rem",
              fontWeight: "700",
              fontSize: "0.95rem",
              color: "#1e293b",
            }}
          >
            {line.replace(/\*\*/g, "")}
          </p>
        );
      }
      if (line.trim() === "")
        return <div key={i} style={{ height: "0.25rem" }} />;
      return (
        <p
          key={i}
          style={{
            margin: "0 0 0.25rem",
            fontSize: "0.88rem",
            color: "#475569",
            lineHeight: 1.8,
          }}
        >
          {line}
        </p>
      );
    });
  };

  if (!activeInterview && interviewList.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          gap: "1rem",
        }}
      >
        <div style={{ fontSize: "3rem" }}>📅</div>
        <h3
          style={{
            margin: 0,
            fontWeight: "700",
            color: "#1e293b",
            fontSize: "1.1rem",
          }}
        >
          No interviews selected yet
        </h3>
        <p
          style={{
            margin: 0,
            color: "#94a3b8",
            fontSize: "0.9rem",
            textAlign: "center",
            maxWidth: "360px",
            lineHeight: 1.6,
          }}
        >
          Head to the <strong>Calendar</strong> tab, click on an interview
          event, and hit <strong>📚 Study for this</strong> to get your
          personalized prep guide.
        </p>
      </div>
    );
  }

  if (!activeInterview && interviewList.length > 0) {
    return (
      <div>
        <div
          style={{
            background: "#1e293b",
            borderRadius: "14px",
            padding: "2rem",
            color: "white",
            marginBottom: "1.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.7rem",
              fontWeight: "700",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#94a3b8",
              margin: "0 0 0.5rem",
            }}
          >
            Study
          </p>
          <h3
            style={{
              fontSize: "1.4rem",
              fontWeight: "800",
              margin: "0 0 0.25rem",
            }}
          >
            Pick an interview to study for
          </h3>
          <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.85rem" }}>
            Select one below or go to the Calendar to add a new one.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "1rem",
          }}
        >
          {interviewList.map((ev, i) => {
            const meta = getInterviewMeta(ev);
            const prepKey = getInterviewKey(ev);
            const hasPrep = Boolean(
              prepLibrary[prepKey]?.content || ev.content || ev.prepContent,
            );

            return (
              <div
                key={i}
                style={{
                  background: "white",
                  border: "1.5px solid #f1f5f9",
                  borderRadius: "14px",
                  padding: "1.5rem",
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
                  🏢
                </div>
                <p
                  style={{
                    margin: "0 0 0.25rem",
                    fontWeight: "700",
                    color: "#1e293b",
                    fontSize: "0.95rem",
                  }}
                >
                  {meta.company}
                </p>
                <p
                  style={{
                    margin: "0 0 0.25rem",
                    fontSize: "0.78rem",
                    color: "#64748b",
                    fontWeight: "600",
                  }}
                >
                  {meta.role}
                </p>
                <p
                  style={{
                    margin: "0 0 1rem",
                    fontSize: "0.75rem",
                    color: "#94a3b8",
                  }}
                >
                  {meta.date}
                </p>
                <button
                  onClick={() => handleSelectInterview(ev)}
                  style={{
                    padding: "6px 14px",
                    background: "#1e293b",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "0.78rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {hasPrep ? "Open Prep ->" : "Generate Prep ->"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 260px",
        gap: "1.5rem",
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
            📚
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
              {activeInterview.title}
            </p>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "#94a3b8" }}>
              {loading
                ? "Generating your prep guide..."
                : done
                  ? "Prep guide ready"
                  : "Streaming response..."}
            </p>
          </div>
          <button
            onClick={() => {
              setActiveInterview(null);
              setStreamedText("");
              setDone(false);
            }}
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
            Back
          </button>
        </div>

        <div
          style={{
            flex: 1,
            padding: "1.5rem 2rem",
            overflowY: "auto",
            minHeight: "400px",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem 0",
              }}
            >
              <div style={{ display: "flex", gap: "4px" }}>
                {[0, 1, 2].map((j) => (
                  <div
                    key={j}
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: "#94a3b8",
                      animation: `pulse 1.2s ease-in-out ${j * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                AI is researching your interview...
              </span>
            </div>
          ) : (
            <>
              {renderFormattedText(streamedText)}
              {!done && (
                <span
                  style={{
                    display: "inline-block",
                    width: "2px",
                    height: "1rem",
                    background: "#1e293b",
                    marginLeft: "2px",
                    animation: "blink 1s step-end infinite",
                    verticalAlign: "middle",
                  }}
                />
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {done && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid #f1f5f9",
              background: "#f8fafc",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
              Want to go deeper on{" "}
              <strong style={{ color: "#1e293b" }}>
                {activeInterview.title}
              </strong>
              ?
            </p>
            <button
              onClick={() => onGoToAskAI(activeInterview)}
              style={{
                padding: "8px 18px",
                background: "#1e293b",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "0.82rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Ask AI about this {"->"}
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          alignSelf: "start",
        }}
      >
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
            Study Guide
          </p>
          <p
            style={{
              margin: "0 0 0.5rem",
              fontWeight: "700",
              fontSize: "0.95rem",
            }}
          >
            AI-Generated Prep
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.78rem",
              color: "#94a3b8",
              lineHeight: 1.6,
            }}
          >
            This guide is tailored specifically to your interview. The AI
            researches the company, role, and context to give you the most
            relevant prep.
          </p>
        </div>

        <div
          style={{
            background: "white",
            border: "1.5px solid #f1f5f9",
            borderRadius: "14px",
            padding: "1.25rem",
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
            After studying...
          </p>
          {[
            "Practice mock questions with AI",
            "Ask about company culture",
            "Get feedback on your answers",
            "Prepare your own questions",
          ].map((tip, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
                marginBottom: "0.65rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "#94a3b8",
                  marginTop: "2px",
                  flexShrink: 0,
                }}
              >
                {"->"}
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  color: "#475569",
                  lineHeight: 1.5,
                }}
              >
                {tip}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "white",
            border: "1.5px solid #f1f5f9",
            borderRadius: "14px",
            padding: "1rem",
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
            Prep Library
          </p>

          {interviewList.length === 0 ? (
            <p style={{ margin: 0, fontSize: "0.78rem", color: "#94a3b8" }}>
              No interviews in your study queue yet.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "0.6rem" }}>
              {interviewList.map((interview, index) => {
                const prepKey = getInterviewKey(interview);
                const meta = getInterviewMeta(interview);
                const hasPrep = Boolean(
                  prepLibrary[prepKey]?.content ||
                  interview.content ||
                  interview.prepContent,
                );
                const isActive = prepKey === activePrepKey;

                return (
                  <button
                    key={`${prepKey}-${index}`}
                    onClick={() => handleSelectInterview(interview)}
                    style={{
                      width: "100%",
                      border: isActive
                        ? "1.5px solid #1e293b"
                        : "1.5px solid #e2e8f0",
                      background: isActive ? "#f8fafc" : "white",
                      borderRadius: "10px",
                      padding: "0.7rem 0.75rem",
                      textAlign: "left",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 0.2rem",
                        fontSize: "0.8rem",
                        fontWeight: "700",
                        color: "#1e293b",
                        lineHeight: 1.3,
                      }}
                    >
                      {meta.company}
                    </p>
                    <p
                      style={{
                        margin: "0 0 0.2rem",
                        fontSize: "0.73rem",
                        color: "#64748b",
                        fontWeight: "600",
                      }}
                    >
                      {meta.role}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.68rem",
                        color: hasPrep ? "#16a34a" : "#94a3b8",
                        fontWeight: "600",
                      }}
                    >
                      {hasPrep ? "Prep generated" : "Click to generate prep"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {done && (
          <button
            onClick={() => onGoToAskAI(activeInterview)}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "white",
              border: "1.5px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "0.82rem",
              fontWeight: "600",
              color: "#1e293b",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>🤖</span> Continue to Ask AI {"->"}
          </button>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default StudyTab;
