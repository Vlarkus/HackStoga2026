import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string

let model: ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']> | null = null

function getModel() {
  if (!model) {
    if (!apiKey || apiKey === 'AIzaSyBinNTa7HKJdrL0CVX-93EDzw4i9r5MK7w') {
      throw new Error('Set VITE_GEMINI_API_KEY in frontend/.env')
    }
    const genAI = new GoogleGenerativeAI(apiKey)
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  }
  return model
}

export interface SingleCompletion {
  label: string
  content: string
}

export const DEFAULT_SYSTEM_PROMPT = `You are a text evolution assistant for a version-control app called "Future-Commit".
Your job is to evolve text in interesting directions. Given the current text and a user direction, produce the next version of the text.
The output should be a natural continuation or evolution — not a summary, not commentary.
Keep it roughly the same length or slightly longer (1-5 sentences added).
Give the output a brief label (2-4 words) describing the direction you took.`

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Make a single Gemini call with retry on 429 rate limits.
 * Takes system instructions, user direction, and the current commit text.
 * Returns one new text evolution.
 */
export async function generateSingleCompletion(
  systemPrompt: string,
  userPrompt: string,
  commitText: string
): Promise<SingleCompletion> {
  const m = getModel()

  const prompt = `${systemPrompt}

User direction: ${userPrompt}

Current text:
"""
${commitText}
"""

Respond ONLY with a JSON object, no markdown fences, no extra text:
{"label": "short label", "content": "the full evolved text including all previous content plus your additions"}`

  const MAX_RETRIES = 2
  let delayMs = 3000

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[AI] Calling Gemini (attempt ${attempt + 1})...`)
      const result = await m.generateContent(prompt)
      const raw = result.response.text().trim()
      console.log('[AI] Got response:', raw.slice(0, 100))

      // Strip markdown code fences if Gemini wraps them
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')

      return JSON.parse(cleaned) as SingleCompletion
    } catch (err: any) {
      console.error(`[AI] Error:`, err?.message ?? err)

      const is429 = err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('Too Many Requests') ||
        err?.message?.includes('RESOURCE_EXHAUSTED')

      if (is429 && attempt < MAX_RETRIES) {
        console.warn(`[AI] 429 rate limit — waiting ${delayMs} ms before retry`)
        await wait(delayMs)
        delayMs *= 2
        continue
      }
      throw err
    }
  }

  throw new Error('Gemini: max retries exceeded')
}
