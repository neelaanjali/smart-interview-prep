import { useEffect, useState } from "react";
import { authedFetch } from "../api/authedFetch";
import { useAuth } from "../hooks/useAuth";
import { logout } from "../services/authService";
import AskAITab from "./dashboard/AskAITab";
import CalendarTab from "./dashboard/CalendarTab";
import { TABS } from "./dashboard/constants";
import OverviewTab from "./dashboard/OverviewTab";
import ProfileTab from "./dashboard/ProfileTab";
import StudyTab from "./dashboard/StudyTab";

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);
  const [studyInterview, setStudyInterview] = useState(null);
  const [askAIInterview, setAskAIInterview] = useState(null);
  const [pastInterviews, setPastInterviews] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isGmailConnected, setIsGmailConnected] = useState(false);

  useEffect(() => {
    checkGmailStatus();
  }, []);

  const checkGmailStatus = async () => {
    try {
      const res = await authedFetch("/auth/gmailStatus");
      const data = await res.json();
      setIsGmailConnected(data.isConnected || false);
    } catch (error) {
      console.error("Failed to check Gmail status:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleConnectGmail = async () => {
    try {
      setIsConnecting(true);
      const res = await authedFetch("/auth/googleConnect");
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Failed to start Gmail connection");
      }
      window.location.href = data.url;
    } catch (error) {
      console.error("Failed to connect Gmail:", error);
      alert("Failed to connect Gmail.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      const res = await authedFetch("/auth/gmailDisconnect", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to disconnect Gmail");
      }
      setIsGmailConnected(false);
      alert("Gmail disconnected successfully.");
    } catch (error) {
      console.error("Failed to disconnect Gmail:", error);
      alert("Failed to disconnect Gmail.");
    }
  };

  const handleStudy = (ev) => {
    setPastInterviews((prev) => {
      const exists = prev.find((p) => p.title === ev.title);
      if (exists) return prev;
      return [...prev, ev];
    });
    setStudyInterview(ev);
    setActiveTab(TABS.STUDY);
  };

  const handleGoToAskAI = (interview) => {
    setAskAIInterview(interview);
    setActiveTab(TABS.ASK_AI);
  };

  const handleClearAIContext = () => {
    setAskAIInterview(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case TABS.OVERVIEW:
        return (
          <OverviewTab
            isConnecting={isConnecting}
            isGmailConnected={isGmailConnected}
            onConnect={handleConnectGmail}
            onDisconnect={handleDisconnectGmail}
          />
        );

      case TABS.CALENDAR:
        return (
          <CalendarTab
            onStudy={handleStudy}
            onConnectGmail={handleConnectGmail}
            isGmailConnected={isGmailConnected}
            onDisconnectGmail={handleDisconnectGmail}
          />
        );

      case TABS.STUDY:
        return (
          <StudyTab
            key={
              studyInterview
                ? `${studyInterview.title}-${studyInterview.date || studyInterview?.raw?.date || ""}`
                : "study-default"
            }
            selectedInterview={studyInterview}
            pastInterviews={pastInterviews}
            onGoToAskAI={handleGoToAskAI}
          />
        );

      case TABS.ASK_AI:
        return (
          <AskAITab
            contextInterview={askAIInterview}
            onClearContext={handleClearAIContext}
          />
        );

      case TABS.PROFILE:
        return (
          <ProfileTab
            user={user}
            onLogout={handleLogout}
            isGmailConnected={isGmailConnected}
            onDisconnectGmail={handleDisconnectGmail}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "inherit",
      }}
    >
      <header
        style={{
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
        }}
      >
        <span
          style={{
            fontSize: "1.05rem",
            fontWeight: "800",
            letterSpacing: "-0.02em",
            color: "#1e293b",
          }}
        >
          Ace AI
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

      <nav
        style={{
          display: "flex",
          padding: "0 48px",
          background: "white",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        {Object.values(TABS).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "none",
              border: "none",
              borderBottom:
                activeTab === tab
                  ? "2.5px solid #1e293b"
                  : "2.5px solid transparent",
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

      <main
        style={{ padding: "2.5rem 48px", maxWidth: "1200px", margin: "0 auto" }}
      >
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
