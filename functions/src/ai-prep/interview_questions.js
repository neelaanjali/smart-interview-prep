const axios = require("axios");

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

async function generateInterviewPrep(interviews) {
  try {
    if (!Array.isArray(interviews) || interviews.length === 0) {
      return [];
    }

    const prepResults = [];

    for (const interview of interviews) {
      console.log("========================================");
      console.log(`Generating prep for: ${interview.company} - ${interview.role}`);
      console.log("========================================\n");

      const prompt = `
Generate tailored prep for this upcoming non-technical interview.

Company: ${interview.company}
Role: ${interview.role}
Interview Type: ${interview.type || "Unknown"}
Interview Date: ${interview.date || "Unknown"}

This is a non-technical interview. It may be a recruiter screen, HR interview, phone screen, screening call, initial interview, one-way interview, prerecorded interview, proctored interview, AI interview, or asynchronous interview.

Return JSON:
{
  "company": "",
  "role": "",
  "type": "",
  "date": "",
  "questions": ["", "", "", "", ""],
  "focusAreas": ["", "", ""],
  "tips": ["", "", ""]
}
`;

      const response = await axios.post(
        "https://api.deepseek.com/chat/completions",
        {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content:
                "Return clean JSON only. Generate exactly 5 tailored non-technical interview prep questions, 3 focus areas, and 3 preparation tips.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        },
        {
          headers: {
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const rawText = response.data?.choices?.[0]?.message?.content;

      if (!rawText) {
        console.error("DeepSeek returned no content.");
        continue;
      }

      const parsed = JSON.parse(rawText);

      const prepItem = {
        company: parsed.company?.trim() || interview.company,
        role: parsed.role?.trim() || interview.role,
        type: parsed.type?.trim() || interview.type || "",
        date: parsed.date?.trim() || interview.date || "",
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        focusAreas: Array.isArray(parsed.focusAreas) ? parsed.focusAreas : [],
        tips: Array.isArray(parsed.tips) ? parsed.tips : [],
      };

      prepResults.push(prepItem);

      console.log("PREP RESULT:");
      console.log(JSON.stringify(prepItem, null, 2));
      console.log("\n");
    }

    return prepResults;
  } catch (error) {
    console.error(
      "DeepSeek API Error in generateInterviewPrep:",
      error.response?.data || error.message
    );
    return [];
  }
}

module.exports = { generateInterviewPrep };