/* eslint-disable */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

const verifyFirebaseUser = require("./src/middleware/verifyFirebaseUser");
const googleConnect = require("./src/auth/googleConnect");
const googleCallback = require("./src/auth/googleCallback");
const gmailStatus = require("./src/auth/gmailStatus");
const gmailDisconnect = require("./src/auth/gmailDisconnect");
const scanGmail = require("./src/services/scanGmail");

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Functions API is alive" });
});

app.get("/me", verifyFirebaseUser, (req, res) => {
  (async () => {
    try {
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(req.user.uid)
        .get();
      const userData = userDoc.exists ? userDoc.data() || {} : {};

      res.json({
        uid: req.user.uid,
        email: req.user.email,
        name: req.user.name,
        displayName: userData.displayName || req.user.name || "",
        lastScannedAt: userData.lastScannedAt || null,
      });
    } catch (error) {
      console.error("Failed to load user profile:", error);
      res.status(500).json({ error: "Failed to load user profile." });
    }
  })();
});

app.get("/interviews", verifyFirebaseUser, async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("interviews")
      .where("uid", "==", req.user.uid)
      .get();

    const interviews = snapshot.docs
      .map((doc) => {
        const data = doc.data() || {};
        const interviewDate =
          data.interviewDate && data.interviewDate.toDate
            ? data.interviewDate.toDate().toISOString()
            : data.date || "";
        return {
          id: doc.id,
          ...data,
          interviewDate,
          date: interviewDate,
          content: data.prepContent || data.content || "",
          raw: {
            ...data,
            interviewDate,
            date: interviewDate,
            content: data.prepContent || data.content || "",
          },
        };
      })
      .sort((a, b) => {
        return (
          new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
        );
      });

    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(req.user.uid)
      .get();
    const userData = userDoc.exists ? userDoc.data() || {} : {};

    return res.json({
      interviews,
      lastScannedAt: userData.lastScannedAt || null,
    });
  } catch (error) {
    console.error("Failed to load interviews:", error);
    return res.status(500).json({ error: "Failed to load interviews." });
  }
});

app.get("/auth/googleConnect", verifyFirebaseUser, googleConnect);
app.get("/auth/googleCallback", googleCallback);
app.get("/auth/gmailStatus", verifyFirebaseUser, gmailStatus);
app.post("/auth/gmailDisconnect", verifyFirebaseUser, gmailDisconnect);

app.post("/gmail/scan", verifyFirebaseUser, scanGmail);

exports.api = functions.https.onRequest(app);
