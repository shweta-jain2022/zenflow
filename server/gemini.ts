// DON'T DELETE THIS COMMENT  
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

import { GoogleGenAI } from "@google/genai";

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateWeeklyReport(journals: string[], moods: string[]): Promise<string> {
    const journalText = journals.length > 0 ? journals.join("\n\n") : "(no entries this week)";
    const moodText = moods.length > 0 ? moods.join(", ") : "(no mood logs this week)";
    
    const prompt = `
You are an empathetic, supportive life coach. Your role is to analyze the user's week, combining their journal entries and mood logs, and provide a clear and friendly weekly reflection. 

### Inputs:
- Journal entries:
${journalText}

- Mood logs:
${moodText}

### Instructions:
  1. Read through the logs and journals.
  2. Write a smooth weekly reflection combining both.
  3. Give one practical coaching tip to help improve the upcoming week.
  4. End with a short motivational message.

  ❌ Do not include section titles like "Highlights", "Tip", or "Closing Motivation".
  ✅ Instead, write everything in natural flowing paragraphs that sound like a coach speaking directly to the user.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        return response.text || "I wasn't able to generate a reflection this week. Please try again later.";
    } catch (error) {
        console.error("Error generating weekly report:", error);
        throw new Error("Failed to generate weekly report");
    }
}