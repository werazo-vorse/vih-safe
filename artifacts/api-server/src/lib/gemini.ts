import { GoogleGenAI } from "@google/genai";

const baseURL = process.env["AI_INTEGRATIONS_GEMINI_BASE_URL"];
const apiKey = process.env["AI_INTEGRATIONS_GEMINI_API_KEY"];

if (!baseURL || !apiKey) {
  throw new Error(
    "AI_INTEGRATIONS_GEMINI_BASE_URL and AI_INTEGRATIONS_GEMINI_API_KEY must be set",
  );
}

export const ai = new GoogleGenAI({
  apiKey,
  httpOptions: { baseUrl: baseURL, apiVersion: "" },
});
