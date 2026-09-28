const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const models = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.8-flash"
];

async function benchmark() {
    console.log("Testing Gemini models with API key...");
    for (const m of models) {
        const t0 = Date.now();
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const res = await model.generateContentStream("Respond in 5 words.");
            for await (const chunk of res.stream) {
                console.log(`[${m}] SUCCESS! TTFT: ${Date.now() - t0}ms`);
                break;
            }
        } catch (e) {
            console.log(`[${m}] ERROR (${Date.now() - t0}ms):`, e.status, e.message);
        }
    }
}
benchmark();
