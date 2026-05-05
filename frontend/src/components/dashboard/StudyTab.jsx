import { useEffect, useRef, useState } from "react";
import { authedFetch } from "../../api/authedFetch";

function StudyTab({ selectedInterview, pastInterviews }) {
  const getInterviewKey = (interview) =>
    interview?.id ||
    interview?.raw?.id ||
    `${interview?.title || "untitled"}::${interview?.date || interview?.raw?.date || "nodate"}`;

  const getStoredContent = (interview) =>
    interview?.content ||
    interview?.prepContent ||
    interview?.raw?.content ||
    interview?.raw?.prepContent ||
    "";

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
  const [done, setDone] = useState(false);
  const [reflectionOutcome, setReflectionOutcome] = useState("");
  const [reflectionConfidence, setReflectionConfidence] = useState(3);
  const [reflectionNotes, setReflectionNotes] = useState("");
  const [savingReflection, setSavingReflection] = useState(false);
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
            const storedContent = getStoredContent(interview);

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

  useEffect(() => {
    if (!activeInterview) {
      setStreamedText("");
      setDone(false);
      return;
    }

    const prepKey = getInterviewKey(activeInterview);
    const existingPrep = prepLibrary[prepKey]?.content;
    const storedContent = getStoredContent(activeInterview);
    const content = existingPrep || storedContent;

    setStreamedText(content || "");
    setDone(Boolean(content));
  }, [activeInterview, prepLibrary]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamedText]);

  useEffect(() => {
    const reflection = activeInterview?.reflection || {};
    setReflectionOutcome(reflection.outcome || "");
    setReflectionConfidence(
      Number.isFinite(reflection.confidence) ? reflection.confidence : 3,
    );
    setReflectionNotes(reflection.notes || "");
  }, [activeInterview?.id, activeInterview?.reflection]);

  const handleSaveReflection = async () => {
    const interviewId = activeInterview?.id;
    if (!interviewId) {
      alert(
        "Open a Gmail-synced interview first. Manual calendar events do not save reflections.",
      );
      return;
    }

    try {
      setSavingReflection(true);

      const res = await authedFetch(`/interviews/${interviewId}/reflection`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reflection: {
            outcome: reflectionOutcome,
            confidence: reflectionConfidence,
            notes: reflectionNotes,
          },
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to save reflection");
      }

      setStoredInterviews((prev) =>
        prev.map((item) =>
          item.id === interviewId
            ? {
                ...item,
                reflection: data.reflection,
              }
            : item,
        ),
      );

      setActiveInterview((prev) =>
        prev
          ? {
              ...prev,
              reflection: data.reflection,
            }
          : prev,
      );
    } catch (error) {
      console.error("Failed to save reflection:", error);
      alert(
        "We couldn't save this reflection. Check your connection and try again.",
      );
    } finally {
      setSavingReflection(false);
    }
  };

  const handleDeleteInterview = async (interview) => {
    const interviewId = interview?.id;
    if (!interviewId) return;

    const confirmed = window.confirm(
      "Remove this saved interview from Study? You can bring it back later by rescanning Gmail.",
    );
    if (!confirmed) return;

    try {
      const res = await authedFetch(`/interviews/${interviewId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete interview");
      }

      setStoredInterviews((prev) =>
        prev.filter((item) => item.id !== interviewId),
      );

      setPrepLibrary((prev) => {
        const next = { ...prev };
        delete next[getInterviewKey(interview)];
        return next;
      });

      if (activeInterview?.id === interviewId) {
        setActiveInterview(null);
        setStreamedText("");
        setDone(false);
      }
    } catch (error) {
      console.error("Failed to delete interview:", error);
      alert("We couldn't remove this interview. Refresh and try again.");
    }
  };

  const handleSelectInterview = (interview) => {
    const prepKey = getInterviewKey(interview);
    const existingPrep = prepLibrary[prepKey];
    const storedContent = getStoredContent(interview);

    setActiveInterview(interview);

    if (existingPrep?.content) {
      setStreamedText(existingPrep.content);
      setDone(true);
      return;
    }

    if (storedContent) {
      setStreamedText(storedContent);
      setDone(true);
      return;
    }

    setStreamedText("");
    setDone(false);
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
          Head to the <strong>Calendar</strong> tab and click
          <strong> 📚 Study for this</strong> on a saved Gmail interview to open
          its prep.
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
            Select a saved interview below or go to Calendar to open one from
            Gmail.
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
              prepLibrary[prepKey]?.content || getStoredContent(ev),
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
                <div style={{ display: "flex", gap: "0.5rem" }}>
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
                    {hasPrep ? "Open Prep ->" : "No Prep Yet"}
                  </button>
                  {ev.id ? (
                    <button
                      onClick={() => handleDeleteInterview(ev)}
                      style={{
                        padding: "6px 10px",
                        background: "#fee2e2",
                        color: "#b91c1c",
                        border: "1px solid #fecaca",
                        borderRadius: "6px",
                        fontSize: "0.78rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                      title="Delete interview"
                    >
                      X
                    </button>
                  ) : null}
                </div>
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
              {done ? "Prep guide ready" : "No generated prep found"}
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
          {done ? (
            renderFormattedText(streamedText)
          ) : (
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
              No saved prep was found for this interview. Run a Gmail scan, then
              open it again.
            </p>
          )}
          <div ref={bottomRef} />
        </div>

        {done && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid #f1f5f9",
              background: "#f8fafc",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
              Prep guide ready for{" "}
              <strong style={{ color: "#1e293b" }}>
                {activeInterview.title}
              </strong>
              .
            </p>
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
            This section only shows prep that has already been generated and
            saved for the selected interview.
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
            "Practice your STAR stories out loud",
            "Review company values and team goals",
            "Refine concise answers for common prompts",
            "Prepare thoughtful questions for interviewers",
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
            Interview Reflection
          </p>

          <p
            style={{
              margin: "0 0 0.45rem",
              fontSize: "0.75rem",
              color: "#64748b",
              fontWeight: "600",
            }}
          >
            Outcome
          </p>
          <div
            style={{ display: "flex", gap: "0.45rem", marginBottom: "0.7rem" }}
          >
            {[
              { value: "good", label: "Good" },
              { value: "okay", label: "Okay" },
              { value: "rough", label: "Rough" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setReflectionOutcome(option.value)}
                style={{
                  padding: "5px 9px",
                  borderRadius: "999px",
                  border:
                    reflectionOutcome === option.value
                      ? "1.5px solid #1e293b"
                      : "1.5px solid #e2e8f0",
                  background:
                    reflectionOutcome === option.value ? "#f8fafc" : "white",
                  color: "#334155",
                  fontSize: "0.72rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          <p
            style={{
              margin: "0 0 0.45rem",
              fontSize: "0.75rem",
              color: "#64748b",
              fontWeight: "600",
            }}
          >
            Confidence ({reflectionConfidence}/5)
          </p>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={reflectionConfidence}
            onChange={(e) => setReflectionConfidence(Number(e.target.value))}
            style={{ width: "100%", marginBottom: "0.7rem" }}
          />

          <p
            style={{
              margin: "0 0 0.45rem",
              fontSize: "0.75rem",
              color: "#64748b",
              fontWeight: "600",
            }}
          >
            Notes
          </p>
          <textarea
            value={reflectionNotes}
            onChange={(e) => setReflectionNotes(e.target.value)}
            placeholder="What went well? What would you improve next time?"
            style={{
              width: "100%",
              minHeight: "90px",
              resize: "vertical",
              border: "1.5px solid #e2e8f0",
              borderRadius: "8px",
              padding: "0.55rem 0.65rem",
              fontSize: "0.78rem",
              color: "#334155",
              boxSizing: "border-box",
              fontFamily: "inherit",
              marginBottom: "0.6rem",
            }}
          />

          <button
            onClick={handleSaveReflection}
            disabled={!activeInterview?.id || savingReflection}
            style={{
              width: "100%",
              padding: "0.5rem",
              background:
                !activeInterview?.id || savingReflection
                  ? "#cbd5e1"
                  : "#1e293b",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: "700",
              cursor:
                !activeInterview?.id || savingReflection
                  ? "not-allowed"
                  : "pointer",
              fontFamily: "inherit",
            }}
          >
            {savingReflection ? "Saving..." : "Save Reflection"}
          </button>
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
              No saved interviews yet. Open Calendar and scan Gmail first.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "0.6rem" }}>
              {interviewList.map((interview, index) => {
                const prepKey = getInterviewKey(interview);
                const meta = getInterviewMeta(interview);
                const hasPrep = Boolean(
                  prepLibrary[prepKey]?.content || getStoredContent(interview),
                );
                const isActive = prepKey === activePrepKey;

                return (
                  <div
                    key={`${prepKey}-${index}`}
                    style={{
                      width: "100%",
                      border: isActive
                        ? "1.5px solid #1e293b"
                        : "1.5px solid #e2e8f0",
                      background: isActive ? "#f8fafc" : "white",
                      borderRadius: "10px",
                      padding: "0.7rem 0.75rem",
                    }}
                  >
                    <button
                      onClick={() => handleSelectInterview(interview)}
                      style={{
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        padding: 0,
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
                        {hasPrep ? "Prep generated" : "Prep not generated yet"}
                      </p>
                    </button>
                    {interview.id ? (
                      <button
                        onClick={() => handleDeleteInterview(interview)}
                        style={{
                          marginTop: "0.5rem",
                          padding: "4px 8px",
                          background: "#fee2e2",
                          color: "#b91c1c",
                          border: "1px solid #fecaca",
                          borderRadius: "5px",
                          fontSize: "0.68rem",
                          fontWeight: "700",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                        title="Delete interview"
                      >
                        X Remove
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudyTab;
