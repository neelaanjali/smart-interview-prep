import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signInWithGoogle } from "../services/authService";

const featureItems = [
  "Saved prep from your interviews",
  "Calendar-linked study sessions",
  "Reflection notes after each interview",
];

const Login = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const accountDeleted =
    new URLSearchParams(location.search).get("accountDeleted") === "1";

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (error) {
      setError(error.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), transparent 35%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
      }}
    >
      <div
        style={{
          width: "min(100%, 860px)",
          borderRadius: "28px",
          background: "rgba(255, 255, 255, 0.82)",
          border: "1px solid rgba(148, 163, 184, 0.22)",
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.12)",
          backdropFilter: "blur(14px)",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        <div
          style={{
            padding: "40px",
            background:
              "linear-gradient(145deg, #0f172a 0%, #1e3a8a 55%, #2563eb 100%)",
            color: "white",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.12)",
              fontSize: "0.78rem",
              fontWeight: "700",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: "22px",
            }}
          >
            Ace AI
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 4vw, 3.4rem)",
              lineHeight: 1,
              letterSpacing: "-0.04em",
              maxWidth: "10ch",
            }}
          >
            Prepare with less noise.
          </h1>

          <p
            style={{
              margin: "18px 0 0",
              maxWidth: "34ch",
              fontSize: "0.98rem",
              lineHeight: 1.7,
              color: "rgba(255, 255, 255, 0.82)",
            }}
          >
            Keep interviews, prep, and reflections in one place. Sign in to open
            your saved prep and continue where you left off.
          </p>

          <div style={{ display: "grid", gap: "10px", marginTop: "28px" }}>
            {featureItems.map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "0.9rem",
                  color: "rgba(255, 255, 255, 0.88)",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "999px",
                    background: "#93c5fd",
                    flexShrink: 0,
                  }}
                />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "40px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 12px",
              borderRadius: "999px",
              background: "#eff6ff",
              color: "#1d4ed8",
              fontSize: "0.78rem",
              fontWeight: "700",
              marginBottom: "18px",
            }}
          >
            Sign in
          </div>

          <h2
            style={{
              margin: "0 0 8px",
              fontSize: "1.6rem",
              color: "#0f172a",
              letterSpacing: "-0.03em",
            }}
          >
            Continue your prep
          </h2>

          <p
            style={{
              margin: "0 0 20px",
              color: "#64748b",
              lineHeight: 1.6,
              fontSize: "0.96rem",
            }}
          >
            Use your Google account to open the dashboard and review stored
            prep.
          </p>

          {accountDeleted && (
            <div
              style={{
                marginBottom: 14,
                borderRadius: 12,
                border: "1px solid #86efac",
                background: "#f0fdf4",
                color: "#166534",
                padding: "12px 14px",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              Your account was deleted successfully.
            </div>
          )}

          {error && (
            <div
              style={{
                marginBottom: 14,
                borderRadius: 12,
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#b91c1c",
                padding: "12px 14px",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px 16px",
              fontSize: "0.98rem",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              background: loading
                ? "linear-gradient(135deg, #93c5fd, #60a5fa)"
                : "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "white",
              border: "none",
              borderRadius: "14px",
              marginTop: "4px",
              boxShadow: loading
                ? "none"
                : "0 12px 24px rgba(37, 99, 235, 0.22)",
            }}
          >
            {loading ? "Signing in..." : "Continue with Google"}
          </button>

          <p
            style={{
              margin: "14px 0 0",
              fontSize: "0.8rem",
              color: "#94a3b8",
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            Only your interview data and saved prep are shown after sign-in.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
