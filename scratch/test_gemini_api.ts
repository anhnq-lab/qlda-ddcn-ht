import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("No API key found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function run() {
    try {
        console.log("Testing Gemini with key:", API_KEY.substring(0, 10) + "...");
        const result = await model.generateContent("Hello, world!");
        console.log("Success! Response:", result.response.text());
    } catch (error: any) {
        console.error("Error connecting to Gemini:", error.message || error);
    }
}

run();
