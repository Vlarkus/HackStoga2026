import { GoogleGenAI } from '@google/genai'

// HACKATHON ONLY — remove after demo
const API_KEY = 'REDACTED_KEY_1'

const ai = new GoogleGenAI({ apiKey: API_KEY })

export interface FuturePrediction {
  label: string
  content: string
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
 * Generate future predictions — creative continuations of the text.
 * Uses Gemini 3 Flash.
 */
export async function generateFuturePredictions(
  text: string,
  count: number,
): Promise<FuturePrediction[]> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are a creative business strategist for a version-control brainstorming app called "FutureCommit".
Given the following business planning text, predict ${count} distinct and creative directions it could evolve next.
Each prediction should be a short continuation (1-3 sentences) exploring a different strategic direction.
Give each one a brief label (2-4 words).

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
