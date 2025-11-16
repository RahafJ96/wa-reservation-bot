import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { HELPResult } from '../types/chat-types';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set ✖️');
} else {
  console.log('GEMINI_API_KEY is correct! ✔️');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const today = new Date().toISOString().split('T')[0];

export async function analyzeUserMessage(message: string): Promise<HELPResult> {
  console.log('[Gemini] analyzeUserMessage called with:', message);

  const prompt = `
You are the helper layer for a restaurant reservation chatbot.

User message: "${message}"

Interpret user messages relative to today's date.

Today's date is ${today}.

Examples:
- "tomorrow" = today + 1 day
- "day after tomorrow" = today + 2 days
- "next Friday" = the next upcoming Friday
- "20th of November" = the next upcoming November 20, even if next year


Extract the user's intent and details.
Return ONLY a JSON object with this exact shape:

{
  "intent": "new_reservation" | "modify_reservation" | "cancel_reservation" | "confirm_reservation" | "small_talk" | "unknown",
  "date": string | null,        // Date in YYYY-MM-DD if understood, otherwise null
  "time": string | null,        // Time in 24h HH:MM if understood, otherwise null
  "guests": number | null,      // Number of guests, otherwise null
  "name": string | null,        // Person's name if mentioned, otherwise null
  "notes": string               // Short explanation of what you inferred
}

Rules:
- If you are not sure about a field, set it to null.
- Respond with ONLY the JSON, no explanation, no markdown, no extra text.
`;

  // New SDK call style from the official quickstart
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const rawText = response.text ?? '{}';

  try {
    const parsed = JSON.parse(rawText);

    // Basic fallback so TS always has all fields
    const result: HELPResult = {
      intent: parsed.intent ?? 'unknown',
      date: parsed.date ?? null,
      time: parsed.time ?? null,
      guests:
        typeof parsed.guests === 'number'
          ? parsed.guests
          : parsed.guests != null
          ? Number(parsed.guests)
          : null,
      name: parsed.name ?? null,
      notes: parsed.notes ?? 'No notes provided',
    };

    return result;
  } catch (err) {
    console.error('Failed to parse Gemini JSON:', rawText, err);
    const fallback: HELPResult = {
      intent: 'unknown',
      date: null,
      time: null,
      guests: null,
      name: null,
      notes: 'Parsing error from Gemini response',
    };
    return fallback;
  }
}
