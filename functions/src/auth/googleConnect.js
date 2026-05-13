/* eslint-disable object-curly-spacing */
const { createOAuthClient } = require("../services/googleOAuthClient");

const googleConnect = async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email;

    const oauth2Client = createOAuthClient();

    const stateObject = {
      uid,
      email,
    };

    const stateJson = JSON.stringify(stateObject);
    const state = Buffer.from(stateJson).toString("base64url");

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent select_account",
      scope: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/gmail.readonly",
      ],
      include_granted_scopes: true,
      login_hint: email,
      state,
    });

    return res.json({ url });
  } catch (error) {
    console.error("Error creating Google OAuth URL:", error);
    return res.status(500).json({ error: "Failed to create Google OAuth URL" });
  }
};

module.exports = googleConnect;
