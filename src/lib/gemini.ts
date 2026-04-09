import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini AI SDK
// The API key is injected by the environment
export const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

export const CHAT_MODEL = "gemini-2.0-flash"; // Using the latest fast model
export const PRO_MODEL = "gemini-3.1-pro-preview"; // For complex tasks if needed
