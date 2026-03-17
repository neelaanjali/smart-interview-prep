import { useState } from "react";
import { logout } from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { authedFetch } from "../api/authedFetch";

const TABS = {
  OVERVIEW: "Overview",
  PRACTICE: "Practice",
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
          <>
            <h3>Overview</h3>
            <p>Welcome back! Ready to prep for your next interview?</p>
            <button onClick={handleConnectGmail}>Connect Gmail</button>
          </>
        );
      case TABS.PRACTICE:
        return (
          <>
            <h3>Practice</h3>
            <p>Mock interviews, questions, and AI feedback will live here.</p>
          </>
        );
      case TABS.PROGRESS:
        return (
          <>
            <h3>Progress</h3>
            <p>Track completed sessions and improvement over time.</p>
          </>
        );
      case TABS.PROFILE:
        return (
          <>
            <h3>Profile</h3>
            <p>Name: {user?.displayName}</p>
            <p>Email: {user?.email}</p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Header */}
      <header
        style={{
          padding: "20px 40px",
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Smart Interview Prep</h2>

        <div>
          <span style={{ marginRight: "15px" }}>
            👋 {user?.displayName || "User"}
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 14px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav
        style={{
          display: "flex",
          gap: "20px",
          padding: "15px 40px",
          background: "#f1f5f9",
        }}
      >
        {Object.values(TABS).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "none",
              border: "none",
              fontSize: "16px",
              cursor: "pointer",
              paddingBottom: "5px",
              borderBottom:
                activeTab === tab
                  ? "2px solid #2563eb"
                  : "2px solid transparent",
              fontWeight: activeTab === tab ? "600" : "400",
            }}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ padding: "40px" }}>
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
