import { GoogleGenAI } from '@google/genai'

// HACKATHON ONLY — remove after demo
const API_KEY = 'REDACTED_KEY_1'

const ai = new GoogleGenAI({ apiKey: API_KEY })

export interface SingleCompletion {
  label: string
  content: string
}

export interface FuturePrediction {
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

export interface DocumentInit {
  title: string
  summary: string
  tags: string[]
}

/**
 * Initialize a document — analyze text and generate title, summary, tags.
 * Uses Gemini 3.1 Pro (higher quality, one-time call).
 */
export async function initializeDocument(text: string): Promise<DocumentInit> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `You are analyzing a business planning document for a version-control brainstorming app.
Given the following text, generate a JSON object with:
- title: a catchy 3-6 word title for this document
- summary: a 1-2 sentence summary of the key idea
- tags: 3-5 relevant business/industry tags

Text:
"""
${text}
"""

Respond ONLY with valid JSON, no markdown fences:
{"title": "...", "summary": "...", "tags": ["...", "..."]}`,
    })

    const raw = response.text?.trim() ?? ''
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    return JSON.parse(cleaned)
  } catch {
    return { title: 'Business Plan', summary: 'A new venture taking shape.', tags: ['startup', 'planning'] }
  }
}

/**
 * Generate creative branch labels for future directions.
 * Uses Gemini 3 Flash (fast, cheap).
 */
export async function generateBranchLabels(
  parentContent: string,
  count: number,
): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a creative business strategist for a brainstorming app.
Given this business planning text, generate ${count} creative and distinct 3-5 word labels
for alternative directions this idea could take. Each label should feel like a branch name
in a version control system — short, evocative, lowercase.

Text:
"""
${parentContent.replace(/<[^>]*>/g, ' ').trim().slice(0, 2000)}
"""

Respond ONLY with a JSON array of strings, no markdown fences:
["label one here", "label two here"]`,
    })

    const raw = response.text?.trim() ?? ''
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    const labels: string[] = JSON.parse(cleaned)
    return labels.slice(0, count)
  } catch {
    const fallbacks = ['bold market pivot', 'conservative growth path', 'viral expansion play', 'niche domination']
    return fallbacks.slice(0, count)
  }
}

/**
 * Make a single Gemini call with retry on 429 rate limits.
 * Uses Gemini 3 Flash.
 */
export async function generateSingleCompletion(
  systemPrompt: string,
  userPrompt: string,
  commitText: string,
): Promise<SingleCompletion> {
  const prompt = `${systemPrompt}

${userPrompt ? `The user wants the text to go in this direction: ${userPrompt}\n` : ''}
Text:
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
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      })
      const raw = result.text?.trim() ?? ''
      console.log('[AI] Got response:', raw.slice(0, 100))

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

/**
 * Generate future predictions — creative continuations of the text.
 * Uses Gemini 3 Flash.
 */
export async function generateFuturePredictions(
  text: string,
  count: number,
  userPrompt?: string,
): Promise<FuturePrediction[]> {
  const directionLine = userPrompt?.trim()
    ? `\nThe user wants the futures to go in this direction: ${userPrompt.trim()}`
    : ''

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are a creative business strategist for a version-control brainstorming app called "FutureCommit".
Given the following business planning text, predict ${count} distinct and creative directions it could evolve next.
Each prediction should be a short continuation (1-3 sentences) exploring a different strategic direction.
Give each one a brief label (2-4 words).${directionLine}

Text:
"""
${text}
"""

Respond ONLY with a JSON array, no markdown fences:
[{"label": "short label", "content": "continuation text"}, ...]`,
  })

  const raw = response.text?.trim() ?? ''
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  const parsed: FuturePrediction[] = JSON.parse(cleaned)
  return parsed.slice(0, count)
}
