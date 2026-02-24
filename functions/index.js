const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Functions API is alive" });
});

const verifyFirebaseUser = require("./src/middleware/verifyFirebaseUser");

app.get("/me", verifyFirebaseUser, (req, res) => {
  res.json({
    uid: req.user.uid,
    email: req.user.email || null,
    name: req.user.name || null,
  });
});

exports.api = functions.https.onRequest(app);