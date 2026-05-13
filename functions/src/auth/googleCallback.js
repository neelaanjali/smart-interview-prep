/* eslint-disable indent */
/* eslint-disable object-curly-spacing */
const { google } = require("googleapis");
const { createOAuthClient } = require("../services/googleOAuthClient");

const googleCallback = async (req, res) => {
  try {
    console.log("✅ Entered googleCallback");

    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send("Missing code or state");
    }

    const parsedState = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8"),
    );

    const { email: firebaseEmail } = parsedState;

    if (!firebaseEmail) {
      return res.status(400).send("Missing signed-in user email in state.");
    }

    const oauth2Client = createOAuthClient();

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    let googleEmail = null;

    if (tokens.id_token) {
      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      googleEmail = ticket.getPayload().email;
    } else {
      const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: "v2",
      });
      const profile = await oauth2.userinfo.get();
      googleEmail = profile.data.email;
    }

    if (googleEmail !== firebaseEmail) {
      return res
        .status(400)
        .send("Connected Google account does not match signed-in user.");
    }

    console.log("✅ Gmail connected successfully");
    console.log("Connected account:", googleEmail);

    if (!global.gmailConnections) {
      global.gmailConnections = {};
    }

    global.gmailConnections[firebaseEmail] = {
      connected: true,
      googleEmail,
      tokens,
      connectedAt: new Date().toISOString(),
    };

    return res.redirect(
      `${process.env.FRONTEND_URL}/dashboard?gmailConnected=true`,
    );
  } catch (error) {
    console.error("❌ Error in Google callback:", error);
    return res.status(500).send("Google callback failed");
  }
};

module.exports = googleCallback;
