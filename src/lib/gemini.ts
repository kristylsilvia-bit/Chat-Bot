import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini AI SDK
// The API key is injected by the environment
export const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

export const CHAT_MODEL = "gemini-3-flash-preview"; // Using the latest Gemini 3 model
export const PRO_MODEL = "gemini-3.1-pro-preview"; // For complex tasks
export const IMAGE_MODEL = "gemini-2.5-flash-image"; // For image generation
