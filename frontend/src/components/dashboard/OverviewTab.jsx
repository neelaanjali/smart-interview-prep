import React from "react";
import aceLogoSvg from "../../assets/ace-of-spades.png"; 

function OverviewTab({
  isConnecting,
  isGmailConnected,
  onConnect,
  onDisconnect,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1.5rem",
      }}
    >
      <div
        style={{
          gridColumn: "1 / -1",
          background: "#1e293b",
          borderRadius: "16px",
          padding: "3rem",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "220px",
            height: "220px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            right: "80px",
            width: "160px",
            height: "160px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "50%",
          }}
        />
        
        {/* Logo and Title Section - UPDATED */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "1rem",
          }}
        >
          <img
            src={aceLogoSvg}
            alt="Ace AI Logo"
            style={{
              width: "32px",
              height: "32px",
            }}
          />
          <p
            style={{
              fontSize: "0.7rem",
              fontWeight: "700",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#94a3b8",
              margin: 0,
            }}
          >
            Ace AI
          </p>
        </div>

        <h2
          style={{
            fontSize: "2rem",
            fontWeight: "800",
            margin: "0 0 1rem",
            lineHeight: 1.2,
          }}
        >
          Land your next role
          <br />
          with confidence.
        </h2>
        <p
          style={{
            color: "#94a3b8",
            fontSize: "0.95rem",
            maxWidth: "520px",
            lineHeight: 1.7,
            margin: "0 0 2rem",
          }}
        >
          Ace AI helps you prepare smarter - not harder. Sync your Gmail to
          automatically detect upcoming interviews, track every session on your
          calendar, and get AI-powered feedback as you practice. Everything you
          need, all in one place.
        </p>
        <button
          onClick={isGmailConnected ? onDisconnect : onConnect}
          disabled={isConnecting}
          style={{
            padding: "12px 24px",
            background: isGmailConnected ? "#fee2e2" : "white",
            color: isGmailConnected ? "#dc2626" : "#1e293b",
            border: isGmailConnected ? "2px solid #fecaca" : "none",
            borderRadius: "10px",
            fontWeight: "700",
            fontSize: "0.9rem",
            cursor: isConnecting ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: isConnecting ? 0.7 : 1,
          }}
        >
          {isConnecting
            ? "Connecting..."
            : isGmailConnected
              ? "Disconnect Gmail"
              : "Connect Gmail ->"}
        </button>
      </div>

      {[
        {
          icon: "📅",
          title: "Interview Calendar",
          desc: "Auto-detect upcoming interviews from Gmail and manage your schedule in one place.",
        },
        {
          icon: "📚",
          title: "Study",
          desc: "Get an AI-generated prep guide tailored to each specific interview and company.",
        },
        {
          icon: "🤖",
          title: "Ask AI",
          desc: "Chat with a Gemini-powered interview coach for mock questions and feedback.",
        },
        {
          icon: "👤",
          title: "Your Profile",
          desc: "Manage your account and customize your interview prep experience.",
        },
      ].map((card) => (
        <div
          key={card.title}
          style={{
            background: "white",
            border: "1.5px solid #f1f5f9",
            borderRadius: "14px",
            padding: "1.75rem",
          }}
        >
          <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
            {card.icon}
          </div>
          <h4
            style={{
              margin: "0 0 0.5rem",
              fontWeight: "700",
              color: "#1e293b",
              fontSize: "1rem",
            }}
          >
            {card.title}
          </h4>
          <p
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: "0.85rem",
              lineHeight: 1.6,
            }}
          >
            {card.desc}
          </p>
        </div>
      ))}
    </div>
  );
}

export default OverviewTab;
