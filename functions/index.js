const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const verifyFirebaseUser = require("./src/middleware/verifyFirebaseUser")

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// sanity check route
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Functions API is alive" });
});

app.get("/me", verifyFirebaseUser, (req, res) => {
  res.json({
    uid: req.user.uid,
    email: req.user.email,
    name: req.user.name,
  });
});

exports.api = functions.https.onRequest(app);
