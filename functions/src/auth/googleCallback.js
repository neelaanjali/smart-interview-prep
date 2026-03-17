const { google } = require("googleapis");
const { createOAuthClient } = require("../services/googleOAuthClient");

const googleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send("Missing code or state");
    }

    const parsedState = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8")
    );

    const { email: firebaseEmail } = parsedState;

    const oauth2Client = createOAuthClient();

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    let googleEmail = null;

    if (tokens.id_token) {
      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      googleEmail = payload.email;
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

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const listResponse = await gmail.users.messages.list({
      userId: "me",
      maxResults: 1,
    });

    const firstMessage = listResponse.data.messages?.[0];

    if (!firstMessage) {
      console.log("No emails found in this Gmail account.");
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    }

    const messageResponse = await gmail.users.messages.get({
      userId: "me",
      id: firstMessage.id,
      format: "metadata",
      metadataHeaders: ["Subject", "From", "Date"],
    });

    const headers = messageResponse.data.payload?.headers || [];

    const subject =
      headers.find((h) => h.name === "Subject")?.value || "No Subject";
    const from = headers.find((h) => h.name === "From")?.value || "Unknown";
    const date = headers.find((h) => h.name === "Date")?.value || "Unknown";

    console.log("First email:");
    console.log({
      id: firstMessage.id,
      subject,
      from,
      date,
      snippet: messageResponse.data.snippet,
    });

    return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error("Error in Google callback:", error);
    return res.status(500).send("Google callback failed");
  }
};

module.exports = googleCallback;