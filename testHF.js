import fetch from "node-fetch";

// Make sure you added your HF token in Replit Secrets as HF_TOKEN
const HF_TOKEN = process.env.HF_TOKEN;

// Use a model that is always available for free
const MODEL = "bigscience/bloom-560m";

// Simple test prompt
const prompt = `
You are a friendly coach.
Summarize this week and give one tip.
User journal: "Felt stressed at work. Went for a 20-min walk and felt better."
`;

async function run() {
  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 100, temperature: 0.2 },
        }),
      },
    );

    const result = await response.json();
    console.log("HF API response:\n", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error calling Hugging Face API:", err);
  }
}

run();
