import { useEffect, useState } from "react";
import { authedFetch } from "../../api/authedFetch";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

const navBtn = {
  background: "none",
  border: "1.5px solid #e2e8f0",
  borderRadius: "8px",
  width: "36px",
  height: "36px",
  fontSize: "1.2rem",
  cursor: "pointer",
  color: "#334155",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "inherit",
};

const selectStyle = {
  border: "1.5px solid #e2e8f0",
  borderRadius: "8px",
  padding: "6px 10px",
  fontSize: "0.9rem",
  fontWeight: "600",
  color: "#1e293b",
  background: "white",
  cursor: "pointer",
  fontFamily: "inherit",
  outline: "none",
};

function parseInterviewDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

function CalendarTab({
  onStudy,
  onConnectGmail,
  isGmailConnected,
  onDisconnectGmail,
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [manualEvents, setManualEvents] = useState({});
  const [backendInterviews, setBackendInterviews] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [loadingInterviews, setLoadingInterviews] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const yearOptions = Array.from(
    { length: 10 },
    (_, i) => today.getFullYear() - 2 + i,
  );

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const res = await authedFetch("/interviews");
        const data = await res.json();
        setBackendInterviews(data.interviews || []);
      } catch (err) {
        console.error("Failed to load interviews:", err);
      } finally {
        setLoadingInterviews(false);
      }
    };
    fetchInterviews();
  }, []);

  const handleDeleteInterview = async (interviewId) => {
    if (!interviewId) return;

    const confirmed = window.confirm(
      "Delete this interview from your list? This cannot be undone.",
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

      setBackendInterviews((prev) =>
        prev.filter((item) => item.id !== interviewId),
      );
    } catch (error) {
      console.error("Failed to delete interview:", error);
      alert("Failed to delete interview");
    }
  };

  const handleScanGmail = async () => {
    try {
      setIsScanning(true);
      const res = await authedFetch("/gmail/scan", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setBackendInterviews(data.results || []);
        alert("Gmail scan completed successfully!");
      } else {
        alert(data.error || "Failed to scan Gmail");
      }
    } catch (error) {
      console.error("Failed to scan Gmail:", error);
      alert("Failed to scan Gmail");
    } finally {
      setIsScanning(false);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const goToToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDay(now.getDate());
  };

  const dateKey = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const backendEventsMap = {};
  backendInterviews.forEach((iv) => {
    const parsed = parseInterviewDate(iv.date);
    if (!parsed) return;
    const key = dateKey(parsed.year, parsed.month, parsed.day);
    if (!backendEventsMap[key]) backendEventsMap[key] = [];
    backendEventsMap[key].push({
      id: iv.id,
      title: `${iv.company} - ${iv.role}`,
      type: "gmail",
      raw: iv,
    });
  });

  const addEvent = () => {
    if (!newEventTitle.trim() || !selectedDay) return;
    const key = dateKey(viewYear, viewMonth, selectedDay);
    setManualEvents((prev) => ({
      ...prev,
      [key]: [
        ...(prev[key] || []),
        { title: newEventTitle.trim(), type: "manual" },
      ],
    }));
    setNewEventTitle("");
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1,
  );
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedKey = selectedDay
    ? dateKey(viewYear, viewMonth, selectedDay)
    : null;
  const selectedEvents = selectedKey
    ? [
        ...(backendEventsMap[selectedKey] || []),
        ...(manualEvents[selectedKey] || []),
      ]
    : [];

  const upcomingInterviews = backendInterviews
    .map((iv) => {
      const parsedDate = new Date(iv.date);
      return {
        ...iv,
        parsedDate,
      };
    })
    .filter((iv) => !Number.isNaN(iv.parsedDate.getTime()))
    .filter((iv) => iv.parsedDate.getTime() >= new Date().setHours(0, 0, 0, 0))
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
    .slice(0, 5);

  const jumpToInterviewDate = (interview) => {
    const date = new Date(interview.date);
    if (Number.isNaN(date.getTime())) return;

    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
    setSelectedDay(date.getDate());
  };

  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "2rem" }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <button onClick={prevMonth} style={navBtn}>
            ‹
          </button>
          <select
            value={viewMonth}
            onChange={(e) => setViewMonth(Number(e.target.value))}
            style={selectStyle}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}
            style={selectStyle}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button onClick={nextMonth} style={navBtn}>
            ›
          </button>

          <button
            onClick={goToToday}
            style={{
              border: "1.5px solid #bfdbfe",
              background: "#eff6ff",
              color: "#1d4ed8",
              borderRadius: "8px",
              padding: "7px 10px",
              fontSize: "0.78rem",
              fontWeight: "700",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Today
          </button>

          <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
            <button
              onClick={
                isGmailConnected
                  ? async () => {
                      setIsDisconnecting(true);
                      await onDisconnectGmail();
                      setIsDisconnecting(false);
                    }
                  : onConnectGmail
              }
              disabled={isGmailConnected ? isDisconnecting : false}
              style={{
                padding: "8px 14px",
                background: isGmailConnected ? "#fee2e2" : "#f0fdf4",
                color: isGmailConnected ? "#dc2626" : "#16a34a",
                border: `1.5px solid ${isGmailConnected ? "#fecaca" : "#bbf7d0"}`,
                borderRadius: "8px",
                fontSize: "0.8rem",
                fontWeight: "600",
                cursor:
                  isGmailConnected && isDisconnecting
                    ? "not-allowed"
                    : "pointer",
                fontFamily: "inherit",
                opacity: isGmailConnected && isDisconnecting ? 0.7 : 1,
              }}
            >
              {isGmailConnected
                ? isDisconnecting
                  ? "Disconnecting..."
                  : "Disconnect Gmail"
                : "Connect Gmail"}
            </button>

            <button
              onClick={handleScanGmail}
              disabled={isScanning}
              style={{
                padding: "8px 14px",
                background: "#dbeafe",
                color: "#2563eb",
                border: "1.5px solid #bfdbfe",
                borderRadius: "8px",
                fontSize: "0.8rem",
                fontWeight: "600",
                cursor: isScanning ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: isScanning ? 0.7 : 1,
              }}
            >
              {isScanning ? "Scanning..." : "Scan Gmail"}
            </button>
          </div>
        </div>

        {loadingInterviews && (
          <div
            style={{
              textAlign: "center",
              padding: "1rem 0",
              fontSize: "0.82rem",
              color: "#94a3b8",
            }}
          >
            Loading your interviews...
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "2px",
            marginBottom: "2px",
          }}
        >
          {DAYS.map((d) => (
            <div
              key={d}
              style={{
                textAlign: "center",
                fontSize: "0.7rem",
                fontWeight: "700",
                color: "#94a3b8",
                padding: "8px 0",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "2px",
          }}
        >
          {cells.map((day, idx) => {
            if (!day) {
              return (
                <div
                  key={idx}
                  style={{
                    background: "#f8fafc",
                    minHeight: "80px",
                    borderRadius: "6px",
                  }}
                />
              );
            }

            const key = dateKey(viewYear, viewMonth, day);
            const dayEvents = [
              ...(backendEventsMap[key] || []),
              ...(manualEvents[key] || []),
            ];
            const isToday =
              day === today.getDate() &&
              viewMonth === today.getMonth() &&
              viewYear === today.getFullYear();
            const isSelected = day === selectedDay;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDay(day)}
                style={{
                  minHeight: "80px",
                  background: isSelected
                    ? "#1e293b"
                    : isToday
                      ? "#eff6ff"
                      : "white",
                  borderRadius: "6px",
                  padding: "8px",
                  cursor: "pointer",
                  border: isSelected
                    ? "2px solid #1e293b"
                    : isToday
                      ? "2px solid #3b82f6"
                      : "2px solid transparent",
                  transition: "all 0.15s",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    color: isSelected
                      ? "white"
                      : isToday
                        ? "#2563eb"
                        : "#334155",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {day}
                </span>
                {dayEvents.slice(0, 2).map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "0.6rem",
                      background: ev.type === "gmail" ? "#dcfce7" : "#dbeafe",
                      color: ev.type === "gmail" ? "#166534" : "#1e40af",
                      borderRadius: "3px",
                      padding: "1px 4px",
                      marginBottom: "2px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontWeight: "500",
                    }}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div style={{ fontSize: "0.6rem", color: "#94a3b8" }}>
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          alignSelf: "start",
        }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <p
            style={{
              margin: "0 0 0.45rem",
              fontSize: "0.72rem",
              fontWeight: "700",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Upcoming Interviews
          </p>

          {upcomingInterviews.length === 0 ? (
            <p style={{ margin: 0, fontSize: "0.78rem", color: "#94a3b8" }}>
              None scheduled yet.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "0.45rem" }}>
              {upcomingInterviews.map((interview) => (
                <button
                  key={interview.id}
                  onClick={() => jumpToInterviewDate(interview)}
                  style={{
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    padding: "0.5rem",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 0.15rem",
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      color: "#1e293b",
                    }}
                  >
                    {interview.company} - {interview.role}
                  </p>
                  <p
                    style={{ margin: 0, fontSize: "0.7rem", color: "#64748b" }}
                  >
                    {interview.parsedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
          {selectedDay ? (
            <>
              <h4
                style={{
                  margin: "0 0 0.25rem",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  color: "#1e293b",
                }}
              >
                {MONTHS[viewMonth]} {selectedDay}, {viewYear}
              </h4>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                  margin: "0 0 1.25rem",
                }}
              >
                {selectedEvents.length} event
                {selectedEvents.length !== 1 ? "s" : ""}
              </p>
              {selectedEvents.length > 0 ? (
                <div style={{ marginBottom: "1.25rem" }}>
                  {selectedEvents.map((ev, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "0.6rem 0.75rem",
                        background: ev.type === "gmail" ? "#f0fdf4" : "#eff6ff",
                        borderLeft: `3px solid ${ev.type === "gmail" ? "#22c55e" : "#3b82f6"}`,
                        borderRadius: "6px",
                        marginBottom: "0.5rem",
                        fontSize: "0.8rem",
                        color: "#334155",
                        fontWeight: "500",
                      }}
                    >
                      {ev.type === "gmail" && (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            color: "#16a34a",
                            display: "block",
                            marginBottom: "4px",
                            fontWeight: "600",
                          }}
                        >
                          FROM GMAIL
                        </span>
                      )}
                      <span style={{ display: "block", marginBottom: "6px" }}>
                        {ev.title}
                      </span>
                      {ev.id ? (
                        <button
                          onClick={() => onStudy(ev)}
                          style={{
                            padding: "4px 10px",
                            background: "#1e293b",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            fontSize: "0.7rem",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          Study for this
                        </button>
                      ) : null}
                      {ev.id ? (
                        <button
                          onClick={() => handleDeleteInterview(ev.id)}
                          style={{
                            marginLeft: "8px",
                            padding: "4px 8px",
                            background: "#fee2e2",
                            color: "#b91c1c",
                            border: "1px solid #fecaca",
                            borderRadius: "5px",
                            fontSize: "0.7rem",
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
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#cbd5e1",
                    marginBottom: "1.25rem",
                  }}
                >
                  No events yet.
                </p>
              )}
              <div
                style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}
              >
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#64748b",
                    marginBottom: "0.5rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Add Event
                </p>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addEvent()}
                  placeholder="e.g. Amazon - HR Screen"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    outline: "none",
                    boxSizing: "border-box",
                    marginBottom: "0.5rem",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={addEvent}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    background: "#1e293b",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Add to Calendar
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", paddingTop: "2rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
                📅
              </div>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                Select a day to view or add events
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarTab;
