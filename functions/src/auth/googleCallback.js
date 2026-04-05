const { google } = require("googleapis");
const { createOAuthClient } = require("../services/googleOAuthClient");
const { getBehavioralInterviews } = require("../services/deepSeekService");

const googleCallback = async (req, res) => {
  try {
    console.log("✅ Entered googleCallback");

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

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const interviewQuery = [
      '(interview OR recruiter OR "phone screen" OR "screening call" OR "hiring manager" OR "HR interview")',
      '(subject:interview OR subject:"interview invitation" OR subject:"phone screen" OR subject:"screening call" OR subject:"HR interview")',
      '-assessment',
      '-hirevue',
      '-hackerrank',
      '-"coding challenge"',
      '-"technical interview"',
      '-in:chats'
    ].join(" ");

    const listResponse = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
      q: interviewQuery,
    });

    const messages = listResponse.data.messages || [];

    if (messages.length === 0) {
      console.log("⚠️ No interview-related emails found.");
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    }

    const detailedMessages = [];

    for (const msg of messages) {
      const messageResponse = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "Date"],
      });

      const headers = messageResponse.data.payload?.headers || [];

      const subject =
        headers.find((h) => h.name === "Subject")?.value || "No Subject";
      const from =
        headers.find((h) => h.name === "From")?.value || "Unknown Sender";
      const date =
        headers.find((h) => h.name === "Date")?.value || "Unknown Date";

      detailedMessages.push({
        subject,
        from,
        snippet: messageResponse.data.snippet || "",
        date,
      });
    }

    console.log("✅ Found possible interview emails:", detailedMessages.length);
    console.log(detailedMessages)

    const interviews = await getBehavioralInterviews(detailedMessages);

    console.log(`✅ Found ${interviews.length} behavioral interview(s)`);

    if (interviews.length > 0) {
      console.log("📋 Behavioral interview invitations:");
      interviews.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.company} - ${item.role}`);
        console.log(`     Type: ${item.type || "Unknown"}`);
      });
    }

    if (!global.interviewData) {
      global.interviewData = {};
    }

    global.interviewData[firebaseEmail] = {
      interviews,
      timestamp: new Date().toISOString(),
    };

    return res.redirect(
      `${process.env.FRONTEND_URL}/dashboard?interviewsFound=${interviews.length}`
    );
  } catch (error) {
    console.error("❌ Error in Google callback:", error);
    return res.status(500).send("Google callback failed");
  }
};

module.exports = googleCallback;