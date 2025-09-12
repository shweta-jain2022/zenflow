import { GoogleGenerativeAI } from "@google/generative-ai";

// Load Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Example data (replace later with real user data)
  const journalEntries = [
    "Felt stressed at work deadlines.",
    "Went for a walk and felt calmer.",
    "Had a fun dinner with friends.",
    "Felt low energy on Friday.",
  ];

  // Missing entries are fine — script will fill them
  const moodLogs = [
    { day: "Mon", mood: "😟" },
    { day: "Wed", mood: "🙂" },
    { day: "Sat", mood: "😀" },
  ];

  // Format journals
  const journals = journalEntries.map((e, i) => `- ${e}`).join("\n");

  // Ensure all days Mon–Sun are covered
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const moods = weekDays
    .map((day) => {
      const log = moodLogs.find((m) => m.day === day);
      return log ? `${day}: ${log.mood}` : `${day}: (no entry)`;
    })
    .join("\n");

  // Coaching prompt
  const prompt = `
You are an empathetic, supportive life coach. Your role is to analyze the user’s week, combining their journal entries and mood logs, and provide a clear and friendly weekly reflection. 

### Inputs:
- Journal entries:
${journals || "(no entries this week)"}

- Mood logs:
${moods}

### Instructions:
  1. Read through the logs and journals.
  2. Write a smooth weekly reflection combining both.
  3. Give one practical coaching tip to help improve the upcoming week.
  4. End with a short motivational message.

  ❌ Do not include section titles like "Highlights", "Tip", or "Closing Motivation".
  ✅ Instead, write everything in natural flowing paragraphs that sound like a coach speaking directly to the user.
  `;

  // Call Gemini API
  const result = await model.generateContent(prompt);

  // Show response
  console.log("\n===== ✨ AI Weekly Reflection ✨ =====\n");
  console.log(result.response.text());
}

run().catch((err) => {
  console.error("Error generating weekly report:", err);
});
