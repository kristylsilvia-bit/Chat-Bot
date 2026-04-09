import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini AI SDK
// The API key is injected by the environment
export const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

export const CHAT_MODEL = "gemini-3-flash-preview";
export const PRO_MODEL = "gemini-3.1-pro-preview";
export const IMAGE_MODEL = "gemini-2.5-flash-image";
export const IMAGE_PRO_MODEL = "gemini-3.1-flash-image-preview";
export const TTS_MODEL = "gemini-2.5-flash-preview-tts";
