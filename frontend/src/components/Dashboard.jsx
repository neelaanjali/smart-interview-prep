import { useState } from "react";
import { logout } from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { authedFetch } from "../api/authedFetch";

const TABS = {
  OVERVIEW: "Overview",
  CALENDAR: "Calendar",
  PROGRESS: "Progress",
  PROFILE: "Profile",
};

const handleConnectGmail = async () => {
  try {
    const res = await authedFetch("/auth/googleConnect");
    const data = await res.json();
    window.location.href = data.url;
  } catch (error) {
    console.error("Failed to connect Gmail:", error);
  }
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

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

const gmailBtn = {
  padding: "8px 14px",
  background: "#f0fdf4",
  color: "#16a34a",
  border: "1.5px solid #bbf7d0",
  borderRadius: "8px",
  fontSize: "0.8rem",
  fontWeight: "600",
  cursor: "pointer",
  fontFamily: "inherit",
};

const connectBtn = {
  padding: "8px 14px",
  background: "white",
  color: "#334155",
  border: "1.5px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "0.8rem",
  fontWeight: "600",
  cursor: "pointer",
  fontFamily: "inherit",
};

function CalendarTab() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [events, setEvents] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);

  const yearOptions = Array.from({ length: 10 }, (_, i) => today.getFullYear() - 2 + i);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const dateKey = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const addEvent = () => {
    if (!newEventTitle.trim() || !selectedDay) return;
    const key = dateKey(viewYear, viewMonth, selectedDay);
    setEvents(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), { title: newEventTitle.trim(), type: "manual" }],
    }));
    setNewEventTitle("");
  };

  const handleScanGmail = async () => {
    setScanning(true);
    await new Promise(r => setTimeout(r, 2000));
    const mockInterviews = [
      { day: 8,  title: "Google – SWE Phone Screen" },
      { day: 14, title: "Meta – System Design Round" },
      { day: 21, title: "Stripe – Behavioral Interview" },
    ];
    const newEvs = { ...events };
    mockInterviews.forEach(({ day, title }) => {
      const key = dateKey(viewYear, viewMonth, day);
      const existing = newEvs[key] || [];
      if (!existing.find(e => e.title === title)) {
        newEvs[key] = [...existing, { title, type: "gmail" }];
      }
    });
    setEvents(newEvs);
    setScanning(false);
    setScanDone(true);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedKey = selectedDay ? dateKey(viewYear, viewMonth, selectedDay) : null;
  const selectedEvents = selectedKey ? (events[selectedKey] || []) : [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "2rem" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <button onClick={prevMonth} style={navBtn}>‹</button>
          <select value={viewMonth} onChange={e => setViewMonth(Number(e.target.value))} style={selectStyle}>
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select value={viewYear} onChange={e => setViewYear(Number(e.target.value))} style={selectStyle}>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={nextMonth} style={navBtn}>›</button>
          <div style={{ marginLeft: "auto", display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handleScanGmail}
              disabled={scanning}
              style={{ ...gmailBtn, opacity: scanning ? 0.7 : 1, cursor: scanning ? "not-allowed" : "pointer" }}
            >
              {scanning ? "Scanning…" : scanDone ? "✓ Gmail Synced" : "Scan Gmail for Interviews"}
            </button>
            <button onClick={handleConnectGmail} style={connectBtn}>Connect Gmail</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "2px" }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: "700", color: "#94a3b8", padding: "8px 0", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {d}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} style={{ background: "#f8fafc", minHeight: "80px", borderRadius: "6px" }} />;
            const key = dateKey(viewYear, viewMonth, day);
            const dayEvents = events[key] || [];
            const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
            const isSelected = day === selectedDay;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDay(day)}
                style={{
                  minHeight: "80px",
                  background: isSelected ? "#1e293b" : isToday ? "#eff6ff" : "white",
                  borderRadius: "6px",
                  padding: "8px",
                  cursor: "pointer",
                  border: isSelected ? "2px solid #1e293b" : isToday ? "2px solid #3b82f6" : "2px solid transparent",
                  transition: "all 0.15s",
                }}
              >
                <span style={{
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  color: isSelected ? "white" : isToday ? "#2563eb" : "#334155",
                  display: "block",
                  marginBottom: "4px",
                }}>
                  {day}
                </span>
                {dayEvents.slice(0, 2).map((ev, i) => (
                  <div key={i} style={{
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
                  }}>
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div style={{ fontSize: "0.6rem", color: "#94a3b8" }}>+{dayEvents.length - 2} more</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", alignSelf: "start" }}>
        {selectedDay ? (
          <>
            <h4 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: "700", color: "#1e293b" }}>
              {MONTHS[viewMonth]} {selectedDay}, {viewYear}
            </h4>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "0 0 1.25rem" }}>
              {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}
            </p>
            {selectedEvents.length > 0 ? (
              <div style={{ marginBottom: "1.25rem" }}>
                {selectedEvents.map((ev, i) => (
                  <div key={i} style={{
                    padding: "0.6rem 0.75rem",
                    background: ev.type === "gmail" ? "#f0fdf4" : "#eff6ff",
                    borderLeft: `3px solid ${ev.type === "gmail" ? "#22c55e" : "#3b82f6"}`,
                    borderRadius: "6px",
                    marginBottom: "0.5rem",
                    fontSize: "0.8rem",
                    color: "#334155",
                    fontWeight: "500",
                  }}>
                    {ev.type === "gmail" && (
                      <span style={{ fontSize: "0.65rem", color: "#16a34a", display: "block", marginBottom: "2px", fontWeight: "600" }}>
                        ✉ FROM GMAIL
                      </span>
                    )}
                    {ev.title}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "1.25rem" }}>No events yet.</p>
            )}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "#64748b", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Add Event</p>
              <input
                type="text"
                value={newEventTitle}
                onChange={e => setNewEventTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addEvent()}
                placeholder="e.g. Amazon – HR Screen"
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
              <button onClick={addEvent} style={{
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
              }}>
                Add to Calendar
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", paddingTop: "2rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📅</div>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Select a day to view or add events</p>
          </div>
        )}
      </div>
    </div>
  );
}

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case TABS.OVERVIEW:
        return (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ gridColumn: "1 / -1", background: "#1e293b", borderRadius: "16px", padding: "3rem", color: "white", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "220px", height: "220px", background: "rgba(255,255,255,0.03)", borderRadius: "50%" }} />
              <div style={{ position: "absolute", bottom: "-60px", right: "80px", width: "160px", height: "160px", background: "rgba(255,255,255,0.04)", borderRadius: "50%" }} />
              <p style={{ fontSize: "0.7rem", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 1rem" }}>Smart Interview Prep</p>
              <h2 style={{ fontSize: "2rem", fontWeight: "800", margin: "0 0 1rem", lineHeight: 1.2 }}>
                Land your next role<br />with confidence.
              </h2>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem", maxWidth: "520px", lineHeight: 1.7, margin: "0 0 2rem" }}>
                Smart Interview Prep helps you prepare smarter — not harder. Sync your Gmail to automatically detect upcoming interviews, track every session on your calendar, and get AI-powered feedback as you practice. Everything you need, all in one place.
              </p>
              <button
                onClick={handleConnectGmail}
                style={{ padding: "12px 24px", background: "white", color: "#1e293b", border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit" }}
              >
                Connect Gmail →
              </button>
            </div>
            {[
              { icon: "📅", title: "Interview Calendar", desc: "Auto-detect upcoming interviews from Gmail and manage your schedule in one place." },
              { icon: "🎯", title: "AI Practice", desc: "Answer mock interview questions and receive instant, detailed AI feedback." },
              { icon: "📈", title: "Track Progress", desc: "See your improvement over time across all your practice sessions." },
              { icon: "👤", title: "Your Profile", desc: "Manage your account and customize your interview prep experience." },
            ].map(card => (
              <div key={card.title} style={{ background: "white", border: "1.5px solid #f1f5f9", borderRadius: "14px", padding: "1.75rem" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>{card.icon}</div>
                <h4 style={{ margin: "0 0 0.5rem", fontWeight: "700", color: "#1e293b", fontSize: "1rem" }}>{card.title}</h4>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem", lineHeight: 1.6 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        );

      case TABS.CALENDAR:
        return <CalendarTab />;

      case TABS.PROGRESS:
        return (
          <div>
            <div style={{ background: "#1e293b", borderRadius: "14px", padding: "2.5rem", color: "white", marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 0.5rem" }}>Your Journey</p>
              <h3 style={{ fontSize: "1.6rem", fontWeight: "800", margin: "0 0 0.5rem" }}>Progress</h3>
              <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.9rem" }}>Track completed sessions and improvement over time.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              {[
                { label: "Sessions Completed", value: "0" },
                { label: "Questions Answered", value: "0" },
                { label: "Avg. Score", value: "—" },
              ].map(stat => (
                <div key={stat.label} style={{ background: "white", border: "1.5px solid #f1f5f9", borderRadius: "14px", padding: "1.75rem", textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", fontWeight: "800", color: "#1e293b", marginBottom: "0.25rem" }}>{stat.value}</div>
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: "500" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case TABS.PROFILE:
        return (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ gridColumn: "1 / -1", background: "#1e293b", borderRadius: "14px", padding: "2.5rem", color: "white", display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", flexShrink: 0 }}>
                {user?.displayName?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.7rem", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase", color: "#94a3b8" }}>Signed in as</p>
                <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.4rem", fontWeight: "800" }}>{user?.displayName || "User"}</h3>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>{user?.email}</p>
              </div>
            </div>
            <div style={{ background: "white", border: "1.5px solid #f1f5f9", borderRadius: "14px", padding: "1.75rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 0.5rem" }}>Full Name</p>
              <p style={{ margin: 0, fontWeight: "600", color: "#1e293b", fontSize: "1rem" }}>{user?.displayName || "—"}</p>
            </div>
            <div style={{ background: "white", border: "1.5px solid #f1f5f9", borderRadius: "14px", padding: "1.75rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 0.5rem" }}>Email</p>
              <p style={{ margin: 0, fontWeight: "600", color: "#1e293b", fontSize: "1rem" }}>{user?.email || "—"}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "inherit" }}>
      <header style={{
        padding: "0 48px",
        background: "white",
        borderBottom: "1px solid #f1f5f9",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: "64px",
        position: "sticky",
        top: 0,
        zIndex: 10,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        <span style={{ fontSize: "1.05rem", fontWeight: "800", letterSpacing: "-0.02em", color: "#1e293b" }}>
          Smart Interview Prep
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "500" }}>
            👋 {user?.displayName || "User"}
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px",
              backgroundColor: "#1e293b",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: "600",
              fontFamily: "inherit",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <nav style={{
        display: "flex",
        padding: "0 48px",
        background: "white",
        borderBottom: "1px solid #f1f5f9",
      }}>
        {Object.values(TABS).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2.5px solid #1e293b" : "2.5px solid transparent",
              fontSize: "0.85rem",
              cursor: "pointer",
              padding: "14px 20px",
              fontWeight: activeTab === tab ? "700" : "500",
              color: activeTab === tab ? "#1e293b" : "#94a3b8",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main style={{ padding: "2.5rem 48px", maxWidth: "1200px", margin: "0 auto" }}>
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;