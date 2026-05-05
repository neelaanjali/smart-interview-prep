/* eslint-disable */

const { google } = require("googleapis");
const admin = require("firebase-admin");
const { createOAuthClient } = require("../services/googleOAuthClient");
const { getBehavioralInterviews } = require("../services/deepSeekService");
const { generateInterviewPrep } = require("../ai-prep/interview_questions");

const MAX_MESSAGES_TO_ANALYZE = 40;
const MAX_INTERVIEWS_TO_PREP = 6;

const buildPrepContent = (prepItem) => {
  const title = `${prepItem.company} - ${prepItem.role}`;
  return [
    `Here is your personalized prep guide for your upcoming ${title} interview.`,
    "",
    "**Likely Questions**",
    ...(prepItem.questions || []).map((question) => `- ${question}`),
    "",
    "**Focus Areas**",
    ...(prepItem.focusAreas || []).map((item) => `- ${item}`),
    "",
    "**Preparation Tips**",
    ...(prepItem.tips || []).map((item) => `- ${item}`),
  ].join("\n");
};

const docIdForPrep = (uid, prepItem) => {
  const key = [
    uid,
    prepItem.company || "company",
    prepItem.role || "role",
    prepItem.date || "date",
  ]
    .join("-")
    .toLowerCase();

  return key
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
};

const markLastScanned = async (uid) => {
  await admin.firestore().collection("users").doc(uid).set(
    {
      lastScannedAt: new Date().toISOString(),
    },
    { merge: true },
  );
};

const scanGmail = async (req, res) => {
  try {
    const firebaseEmail = req.user && req.user.email;

    if (!firebaseEmail) {
      return res
        .status(401)
        .json({ error: "Unauthorized. No user email found." });
    }

    const connection =
      global.gmailConnections && global.gmailConnections[firebaseEmail];

    if (!connection || !connection.tokens) {
      return res.status(400).json({
        error: "Gmail is not connected for this user.",
      });
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(connection.tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(req.user.uid)
      .get();
    const userData = userDoc.exists ? userDoc.data() || {} : {};
    const lastScannedAt = userData.lastScannedAt || null;
    const defaultAfterSeconds = Math.floor(
      (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000,
    );
    const parsedLastScanned = lastScannedAt
      ? Math.floor(new Date(lastScannedAt).getTime() / 1000)
      : null;
    const afterSeconds =
      Number.isFinite(parsedLastScanned) && parsedLastScanned > 0
        ? parsedLastScanned
        : defaultAfterSeconds;

    const interviewQuery = [
      "(",
      'interview OR recruiter OR "phone screen" OR "screening call" OR',
      '"hiring manager" OR "HR interview" OR "one-way interview" OR',
      '"prerecorded interview" OR "AI interview" OR',
      '"interview process" OR invite OR invitation OR schedule OR',
      'availability OR "google meet" OR "google meets" OR',
      '"30-45 min" OR "move forward" OR application',
      ")",
      "-assessment",
      "-hackerrank",
      "-codility",
      '-"coding challenge"',
      '-"technical interview"',
      '-"take-home"',
      "-in:chats",
    ].join(" ");

    const q = `${interviewQuery} after:${afterSeconds}`;

    let pageToken = undefined;
    const messages = [];
    do {
      const listResponse = await gmail.users.messages.list({
        userId: "me",
        maxResults: 50,
        q,
        pageToken,
      });

      const pageMessages = listResponse.data.messages || [];
      messages.push(...pageMessages);

      if (messages.length >= MAX_MESSAGES_TO_ANALYZE) {
        break;
      }

      pageToken = listResponse.data.nextPageToken;
    } while (pageToken);

    const messagesToAnalyze = messages.slice(0, MAX_MESSAGES_TO_ANALYZE);

    if (!messagesToAnalyze.length) {
      await markLastScanned(req.user.uid);
      return res.json({
        results: [],
        message: "No interview-related emails found.",
      });
    }

    const detailedMessages = [];

    for (const msg of messagesToAnalyze) {
      const messageResponse = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "Date"],
      });

      const headers =
        (messageResponse.data.payload &&
          messageResponse.data.payload.headers) ||
        [];

      const subject =
        (headers.find((h) => h.name === "Subject") || {}).value || "No Subject";
      const from =
        (headers.find((h) => h.name === "From") || {}).value ||
        "Unknown Sender";
      const date =
        (headers.find((h) => h.name === "Date") || {}).value || "Unknown Date";

      detailedMessages.push({
        subject,
        from,
        snippet: messageResponse.data.snippet || "",
        date,
      });
    }

    const interviews = await getBehavioralInterviews(detailedMessages);
    const interviewsToPrepare = interviews.slice(0, MAX_INTERVIEWS_TO_PREP);

    if (!interviewsToPrepare.length) {
      await markLastScanned(req.user.uid);
      return res.json({
        results: [],
        message: "No non-technical interview invitations found.",
      });
    }

    const prepResults = await generateInterviewPrep(interviewsToPrepare);
    if (prepResults.length !== interviewsToPrepare.length) {
      throw new Error("Prep generation did not complete for all interviews.");
    }
    const saved = [];

    for (const prepItem of prepResults) {
      const title = `${prepItem.company} - ${prepItem.role}`;
      const content = buildPrepContent(prepItem);
      const payload = {
        uid: req.user.uid,
        company: prepItem.company || "",
        role: prepItem.role || "",
        title,
        type: prepItem.type || "Interview",
        interviewDate: prepItem.date || "",
        prepContent: content,
        questions: Array.isArray(prepItem.questions) ? prepItem.questions : [],
        focusAreas: Array.isArray(prepItem.focusAreas)
          ? prepItem.focusAreas
          : [],
        tips: Array.isArray(prepItem.tips) ? prepItem.tips : [],
        source: "gmail",
      };

      const id = docIdForPrep(req.user.uid, prepItem);
      await admin
        .firestore()
        .collection("interviews")
        .doc(id)
        .set(payload, { merge: true });

      saved.push({
        id,
        ...payload,
        date: prepItem.date || "",
        content,
        raw: {
          ...payload,
          content,
        },
      });
    }

    await markLastScanned(req.user.uid);

    return res.json({
      results: saved,
      interviewsFound: interviews.length,
      prepGenerated: prepResults.length,
      truncated: {
        messages: messages.length > MAX_MESSAGES_TO_ANALYZE,
        interviews: interviews.length > MAX_INTERVIEWS_TO_PREP,
      },
    });
  } catch (error) {
    console.error("❌ Error in scanGmail:", error);
    return res.status(500).json({
      error: "Failed to scan Gmail and generate interview prep.",
    });
  }
};

module.exports = scanGmail;
