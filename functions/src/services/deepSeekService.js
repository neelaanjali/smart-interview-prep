/* eslint-disable quotes */
/* eslint-disable quote-props */
/* eslint-disable object-curly-spacing */
/* eslint-disable max-len */
/* eslint-disable indent */
const axios = require("axios");

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

/**
 * Extract non-technical interview invitations using DeepSeek.
 * @param {Array} emails
 * @return {Promise<Array>}
 */
async function getBehavioralInterviews(emails) {
  if (!emails || !emails.length) return [];

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
    "",
    "Important:",
    "- If an interview is prerecorded, AI-based, one-way, or proctored, KEEP it",
    "  as long as it is not technical.",
    "- Return only non-technical interview invitations.",
    "",
    "Return JSON:",
    "[",
    '  { "company": "", "role": "", "type": "", "date": ""  }',
    "]",
    "",
    "Emails:",
  ];

  let prompt = promptLines.join("\n") + "\n";
  prompt += emails
    .map((e) =>
      JSON.stringify({
        subject: e.subject,
        from: e.from,
        snippet: e.snippet,
      }),
    )
    .join("\n");

  const res = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "Return clean JSON only. Keep non-technical interview invitations, " +
            "including prerecorded, AI, and proctored interviews.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      max_tokens: 800,
    },
    {
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  let content = "";
  if (
    res &&
    res.data &&
    Array.isArray(res.data.choices) &&
    res.data.choices[0] &&
    res.data.choices[0].message
  ) {
    content = res.data.choices[0].message.content.trim();
  }

  content = content.replace(/```json|```/g, "").trim();

  const parsed = JSON.parse(content);

  const seen = new Set();
  const finalList = [];

  for (const item of parsed) {
    const company = (item.company || "").trim();
    const role = (item.role || "").trim();
    const type = (item.type || "").trim();
    const date = (item.date || "").trim();

    if (!company || !role) continue;

    const key = `${company.toLowerCase()}__${role.toLowerCase()}`;
    if (seen.has(key)) continue;

    seen.add(key);
    finalList.push({ company, role, type, date });
  }

  return finalList;
}

module.exports = { getBehavioralInterviews };
