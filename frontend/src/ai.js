import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyCgLFd1QD2fYPHga2mHrSo7g1Nmd1tR9OY" });


async function generateText(text) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `You are a creative assistant. Given the following text, predict the most likely natural next direction it could evolve. Be concise and creative. Highlight errors.

Text: "${text}"

Respond ONLY as JSON, no extra text:
{ "label": "Prediction", "content": "..." }`
  });

  return JSON.parse(response.text);
}

const result = await generateText("The hero walked into the dark forest");
console.log(result);