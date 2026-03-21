import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("REDACTED_KEY_3");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function generateText(text) {
  const prompt = `You are a creative assistant. Given the following text, predict the most likely natural next direction it could evolve. Be concise and creative. Highlight errors.

Text: "${text}"

Respond ONLY as JSON, no extra text:
{ "label": "Prediction", "content": "..." }`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();

}

const result = await generateText("The hero walked into the dark forest");
console.log(result);