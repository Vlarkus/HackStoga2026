import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string

let model: ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']> | null = null

function getModel() {
  if (!model) {
    if (!apiKey || apiKey === 'your-key-here') {
      throw new Error('Set VITE_GEMINI_API_KEY in frontend/.env')
    }
    const genAI = new GoogleGenerativeAI(apiKey)
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  }
  return model
}

export interface FuturePrediction {
  label: string
  content: string
}

/**
 * Given the current document text, ask Gemini to predict `count` possible
 * future directions the text could evolve toward.
 */
export async function generateFuturePredictions(
  text: string,
  count: number,
  userPrompt?: string,
): Promise<FuturePrediction[]> {
  const m = getModel()

  const directionLine = userPrompt?.trim()
    ? `\nThe user wants the futures to go in this direction: ${userPrompt.trim()}`
    : ''

  const prompt = `You are a creative writing assistant for a version-control app called "Future-Commit".
Given the following text, predict ${count} distinct and creative directions it could evolve next.
Each prediction should be a short continuation (1-3 sentences).
Give each one a brief label (2-4 words).${directionLine}

Text:
"""
${text}
"""

Respond ONLY with a JSON array, no markdown fences, no extra text:
[{"label": "short label", "content": "continuation text"}, ...]`

  const result = await m.generateContent(prompt)
  const raw = result.response.text().trim()

  // Strip markdown code fences if Gemini wraps them
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')

  const parsed: FuturePrediction[] = JSON.parse(cleaned)
  return parsed.slice(0, count)
}
