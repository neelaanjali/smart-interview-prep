const { GoogleGenAI } = require('@google/genai');
const readline = require('readline');

// Setup the client (Remember to use a brand new key!)
const ai = new GoogleGenAI({ apiKey: "INSERT_YOUR_API_KEY_HERE" });

// Setup the interface to read user input from the terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// A quick helper function to pause and wait for the user to type
const askQuestion = (query) => {
    return new Promise((resolve) => rl.question(query, resolve));
};

async function runInterviewPrep() {
    try {
        // 1. Gather User Inputs
        const company = await askQuestion("Please give me a Company: ");
        const position = await askQuestion("Please give me a Position: ");
        const name = await askQuestion("Please give me your Name: ");

        // Close the input stream since we have all the answers
        rl.close();

        // 2. Build the Sentence (using JS template literals)
        const sentence = `My name is ${name}. I am applying for ${position} at ${company}. Please give me 5 interview prep questions.`;
        console.log(`\nSending prompt: "${sentence}"\n`);

        // 3. Call the Gemini API
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", 
            contents: sentence,
            config: {
                systemInstruction: "Give raw output only. No conversational filler."
            }
        });

        // 4. Print the Result
        console.log("--- Interview Questions ---");
        console.log(response.text);

    } catch (error) {
        console.error("Connection Error:", error);
    }
}

// Run the function
runInterviewPrep();