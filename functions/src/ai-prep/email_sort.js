const { GoogleGenAI } = require('@google/genai');

// We are using process.env so your key stays hidden!
const ai = new GoogleGenAI({ apiKey: "INSERT_API_KEY" });

async function getBehavioralInterviews(emails) {
  if (!emails || !emails.length) return [];

  const prompt = `
Extract ONLY non-technical interview invitations.

KEEP:
- behavioral interviews
- recruiter screens
- HR interviews
- phone screens
- screening calls
- initial interviews
- one-way interviews
- prerecorded interviews
- proctored interviews
- AI interviews
- asynchronous interviews

REMOVE:
- technical interviews
- coding assessments
- online assessments that are technical
- hackerrank
- codility
- coding challenges
- take-home tasks
- reminders
- confirmations
- reschedules
- follow-ups
- duplicates

Important:
- If an interview is prerecorded, AI-based, one-way, or proctored, KEEP it as long as it is not technical.
- Return only non-technical interview invitations.

Return JSON:
[
  { "company": "", "role": "", "type": "", "date": ""  }
]

Emails:
${emails
  .map((e) =>
    JSON.stringify({
      subject: e.subject,
      from: e.from,
      snippet: e.snippet,
    })
  )
  .join("\n")}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
      config: {
        systemInstruction: "Return clean JSON only. Keep non-technical interview invitations, including prerecorded, AI, and proctored interviews.",
        temperature: 0,
        responseMimeType: "application/json", 
      }
    });

    const parsed = JSON.parse(response.text);

    const seen = new Set();
    const finalList = [];

    for (const item of parsed) {
      const company = item.company?.trim();
      const role = item.role?.trim();
      const type = item.type?.trim();
      const date = item.date?.trim();

      if (!company || !role) continue;

      const key = `${company.toLowerCase()}__${role.toLowerCase()}`;
      if (seen.has(key)) continue;

      seen.add(key);
      finalList.push({ company, role, type, date });
    }

    return finalList;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return []; 
  }
}

module.exports = { getBehavioralInterviews };