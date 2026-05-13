const {GoogleGenAI} = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Extract non-technical interview invitations from emails using Gemini.
 * @param {Array} emails
 * @return {Promise<Array>}
 */
async function getBehavioralInterviews(emails) {
  if (!Array.isArray(emails) || emails.length === 0) {
    return [];
  }

  const promptLines = [
    "Extract ONLY non-technical interview invitations.",
    "",
    "KEEP:",
    "- behavioral interviews",
    "- recruiter screens",
    "- HR interviews",
    "- phone screens",
    "- screening calls",
    "- initial interviews",
    "- one-way interviews",
    "- prerecorded interviews",
    "- proctored interviews",
    "- AI interviews",
    "- asynchronous interviews",
    "",
    "REMOVE:",
    "- technical interviews",
    "- coding assessments",
    "- online assessments that are technical",
    "- hackerrank",
    "- codility",
    "- coding challenges",
    "- take-home tasks",
    "- reminders",
    "- confirmations",
    "- reschedules",
    "- follow-ups",
    "- duplicates",
    "- rejections",
    "",
    "Important:",
    "- If an interview is prerecorded, AI-based, one-way, " +
      "or proctored, KEEP it as long as it is not technical.",
    "- Return only non-technical interview invitations.",
    "- If a field is unknown, return an empty string.",
    "",
    "Return JSON:",
    "[",
    "  { \"company\": \"\", \"role\": \"\", \"type\": \"\", \"date\": \"\" }",
    "]",
    "",
    "Emails:",
  ];

  let prompt = promptLines.join("\n") + "\n";

  prompt += emails
      .map((e) => JSON.stringify({
        subject: e.subject || "",
        from: e.from || "",
        snippet: e.snippet || "",
      },
      ),
      )
      .join("\n");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "Return clean JSON only. Keep only non-technical " +
          "interview invitations, including prerecorded, AI-based, " +
          "one-way, asynchronous, and proctored interviews.",
        temperature: 0,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text);

    if (!Array.isArray(parsed)) {
      console.log("Sorter returned non-array JSON:", parsed);
      return [];
    }

    const seen = new Set();
    const finalList = [];

    for (const item of parsed) {
      const company = (item.company || "").trim();
      const role = (item.role || "").trim();
      const type = (item.type || "").trim();
      const date = (item.date || "").trim();

      if (!company || !role) continue;

      const key = [
        company.toLowerCase(),
        role.toLowerCase(),
        type.toLowerCase(),
        date.toLowerCase(),
      ].join("__");

      if (seen.has(key)) continue;
      seen.add(key);

      finalList.push({
        company,
        role,
        type,
        date,
      });
    }

    console.log("\n=== FILTERED NON-TECHNICAL INTERVIEWS ===");
    console.log(JSON.stringify(finalList, null, 2));

    return finalList;
  } catch (error) {
    console.error("Gemini API Error in getBehavioralInterviews:", error);
    return [];
  }
}

module.exports = {getBehavioralInterviews};
