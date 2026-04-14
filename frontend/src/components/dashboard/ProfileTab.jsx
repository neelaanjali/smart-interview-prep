import { useEffect, useRef, useState } from "react";
import { authedFetch } from "../../api/authedFetch";
import aceLogo from "../../assets/ace-of-spades.png"; 

function ProfileTab({
  user,
  onLogout,
  onDeleteAccount,
  isGmailConnected,
  onDisconnectGmail,
}) {
  const [photo, setPhoto] = useState(user?.photoURL || null);
  const [hovering, setHovering] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const fetchScanData = async () => {
      try {
        const res = await authedFetch("/me");
        const data = await res.json();
        setLastScanned(data.lastScannedAt || null);
      } catch (err) {
        console.error("Failed to fetch scan time:", err);
      }
    };
    fetchScanData();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const formatLastScanned = (ts) => {
    if (!ts) return "Never";
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const joinDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recently";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div
        style={{
          background: "#1e293b",
          borderRadius: "16px",
          padding: "2.5rem",
          color: "white",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "280px",
            height: "280px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-40px",
            right: "120px",
            width: "180px",
            height: "180px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "50%",
          }}
        />

        <div
          style={{
            position: "relative",
            flexShrink: 0,
            cursor: "pointer",
            zIndex: 1,
          }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onClick={() => fileRef.current.click()}
        >
          <div
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.2)",
              overflow: "hidden",
              background: "rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.2rem",
              fontWeight: "800",
              color: "white",
              transition: "filter 0.2s",
              filter: hovering ? "brightness(0.55)" : "brightness(1)",
            }}
          >
            {photo ? (
              <img
                src={photo}
                alt="profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              user?.displayName?.[0]?.toUpperCase() || "U"
            )}
          </div>
          {hovering && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>📷</span>
              <span
                style={{
                  fontSize: "0.55rem",
                  fontWeight: "700",
                  color: "white",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Change
              </span>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ display: "none" }}
          />
        </div>

        <div style={{ flex: 1, zIndex: 1 }}>
          {/* FIX: Add logo next to "Your Profile" */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.2rem" }}>
            <img
              src={aceLogo}
              alt="Ace AI Logo"
              style={{
                width: "18px",
                height: "18px",
                objectFit: "contain",
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize: "0.68rem",
                fontWeight: "700",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#64748b",
              }}
            >
              Your Profile
            </p>
          </div>
          <h2
            style={{
              margin: "0 0 0.3rem",
              fontSize: "1.85rem",
              fontWeight: "800",
              lineHeight: 1.15,
            }}
          >
            {user?.displayName || "User"}
          </h2>
          <p
            style={{
              margin: "0 0 1.1rem",
              color: "#94a3b8",
              fontSize: "0.88rem",
            }}
          >
            {user?.email}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <span
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: "0.73rem",
                color: "#cbd5e1",
                fontWeight: "500",
              }}
            >
              Joined {joinDate}
            </span>
            <span
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: "0.73rem",
                color: "#cbd5e1",
                fontWeight: "500",
              }}
            >
              Gmail {isGmailConnected ? "Connected" : "Not connected"}
            </span>
          </div>
        </div>
      </div>

      {/* Rest of the component remains the same */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
      >
        <div
          style={{
            background: "white",
            border: "1.5px solid #f1f5f9",
            borderRadius: "14px",
            padding: "1.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.68rem",
              fontWeight: "700",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#94a3b8",
              margin: "0 0 0.4rem",
            }}
          >
            Full Name
          </p>
          <p
            style={{
              margin: 0,
              fontWeight: "600",
              color: "#1e293b",
              fontSize: "1rem",
            }}
          >
            {user?.displayName || "-"}
          </p>
        </div>

        <div
          style={{
            background: "white",
            border: "1.5px solid #f1f5f9",
            borderRadius: "14px",
            padding: "1.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.68rem",
              fontWeight: "700",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#94a3b8",
              margin: "0 0 0.4rem",
            }}
          >
            Email Address
          </p>
          <p
            style={{
              margin: 0,
              fontWeight: "600",
              color: "#1e293b",
              fontSize: "1rem",
            }}
          >
            {user?.email || "-"}
          </p>
        </div>

        <div
          style={{
            background: "white",
            border: "1.5px solid #f1f5f9",
            borderRadius: "14px",
            padding: "1.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.68rem",
              fontWeight: "700",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#94a3b8",
              margin: "0 0 0.4rem",
            }}
          >
            Last Scanned
          </p>
          <p
            style={{
              margin: 0,
              fontWeight: "600",
              color: "#1e293b",
              fontSize: "0.95rem",
            }}
          >
            {formatLastScanned(lastScanned)}
          </p>
        </div>

        <div
          style={{
            background: "white",
            border: "1.5px solid #f1f5f9",
            borderRadius: "14px",
            padding: "1.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.68rem",
              fontWeight: "700",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#94a3b8",
              margin: "0 0 0.4rem",
            }}
          >
            Account Status
          </p>
          <p
            style={{
              margin: 0,
              fontWeight: "600",
              color: "#1e293b",
              fontSize: "1rem",
            }}
          >
            Active
          </p>
        </div>
      </div>

      <div
        style={{
          background: isGmailConnected ? "#fef2f2" : "#f0fdf4",
          border: isGmailConnected
            ? "1.5px solid #fecaca"
            : "1.5px solid #bbf7d0",
          borderRadius: "14px",
          padding: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 0.25rem",
              fontWeight: "700",
              color: isGmailConnected ? "#991b1b" : "#166534",
              fontSize: "0.9rem",
            }}
          >
            {isGmailConnected ? "Gmail Connected" : "Connect Gmail"}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.8rem",
              color: isGmailConnected ? "#dc2626" : "#15803d",
            }}
          >
            {isGmailConnected
              ? "Your Gmail is connected. Interview emails will be automatically detected."
              : "Connect your Gmail to automatically detect upcoming interviews."}
          </p>
        </div>
        {isGmailConnected && (
          <button
            onClick={async () => {
              setIsDisconnecting(true);
              await onDisconnectGmail();
              setIsDisconnecting(false);
            }}
            disabled={isDisconnecting}
            style={{
              padding: "8px 20px",
              background: isDisconnecting ? "#fee2e2" : "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: "700",
              cursor: isDisconnecting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              flexShrink: 0,
              opacity: isDisconnecting ? 0.7 : 1,
            }}
          >
            {isDisconnecting ? "Disconnecting..." : "Disconnect Gmail"}
          </button>
        )}
      </div>

      <div
        style={{
          background: "white",
          border: "1.5px solid #fee2e2",
          borderRadius: "14px",
          padding: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 0.25rem",
              fontWeight: "700",
              color: "#1e293b",
              fontSize: "0.9rem",
            }}
          >
            Sign out of your account
          </p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
            You can sign back in anytime with your Google account.
          </p>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: "8px 20px",
            background: "#fef2f2",
            color: "#dc2626",
            border: "1.5px solid #fecaca",
            borderRadius: "8px",
            fontSize: "0.82rem",
            fontWeight: "700",
            cursor: "pointer",
            fontFamily: "inherit",
            flexShrink: 0,
          }}
        >
          Sign Out
        </button>
      </div>

      <div
        style={{
          background: "#fff1f2",
          border: "1.5px solid #fecdd3",
          borderRadius: "14px",
          padding: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 0.25rem",
              fontWeight: "700",
              color: "#9f1239",
              fontSize: "0.9rem",
            }}
          >
            Delete Account
          </p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#be123c" }}>
            Permanently delete your account and all interview data.
          </p>
        </div>
        <button
          onClick={async () => {
            const confirmed = window.confirm(
              "Delete your account and all interviews? This cannot be undone.",
            );
            if (!confirmed) return;

            const secondConfirm = window.confirm(
              "Final check: this will permanently remove everything. Continue?",
            );
            if (!secondConfirm) return;

            try {
              setIsDeletingAccount(true);
              if (onDeleteAccount) {
                await onDeleteAccount();
              }
            } finally {
              setIsDeletingAccount(false);
            }
          }}
          disabled={isDeletingAccount}
          style={{
            padding: "8px 20px",
            background: isDeletingAccount ? "#fda4af" : "#be123c",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.82rem",
            fontWeight: "700",
            cursor: isDeletingAccount ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            flexShrink: 0,
            opacity: isDeletingAccount ? 0.8 : 1,
          }}
        >
          {isDeletingAccount ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </div>
  );
}

export default ProfileTab;