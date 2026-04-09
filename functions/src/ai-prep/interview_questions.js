const { GoogleGenAI } = require('@google/genai');

// 1. Import your sorting function from the other file
const { getBehavioralInterviews } = require('./email_sort.js');

// Setup the client using your placeholder string!
const ai = new GoogleGenAI({ apiKey: "INSERT_API_KEY" });

// Dummy email data so you can test the connection
//const testEmails = [
//    { subject: "Interview Invitation", from: "hr@google.com", snippet: "We would like to invite you to a phone screen for the Software Engineer role." },
//    { subject: "HackerRank Assessment", from: "amazon@amazon.com", snippet: "Please complete this coding assessment for the Backend Dev role." },
//    { subject: "Next Steps", from: "recruiting@delta.com", snippet: "Please complete your HireVue prerecorded interview for the Data Analyst position." }
//];

async function runInterviewPrep() {
    try {
        console.log("Scanning emails for behavioral interviews...");

        // 2. Call the function from your OTHER file
        const upcomingInterviews = await getBehavioralInterviews(testEmails);

        // If it didn't find any non-technical interviews, stop the program
        if (upcomingInterviews.length === 0) {
            console.log("No upcoming behavioral interviews found in your emails.");
            return;
        }

        console.log(`Found ${upcomingInterviews.length} interviews! Generating prep questions...\n`);

        // 3. Loop through every interview found and ask Gemini for questions
        for (const interview of upcomingInterviews) {
            console.log(`\n========================================`);
            console.log(` Generating questions for: ${interview.company} - ${interview.role}`);
            console.log(`========================================\n`);

            // Dynamically inject the company, role, and type into the prompt
            const sentence = `I have a ${interview.type} coming up for the ${interview.role} position at ${interview.company}. Please give me 5 tailored interview prep questions.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash", 
                contents: sentence,
                config: {
                    systemInstruction: "Give raw output only. No conversational filler. Number the questions 1 through 5. Do NOT use markdown, asterisks, or bullet points anywhere in your response. Use plain text and standard spacing only."
                }
            });

            console.log(response.text);
        }

        console.log("\nAll prep questions generated! Good luck!");

    } catch (error) {
        console.error("Connection Error:", error);
    }
}

// Run the function
runInterviewPrep();