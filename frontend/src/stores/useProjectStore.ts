import { defineStore } from 'pinia'
import { generateSingleCompletion, DEFAULT_SYSTEM_PROMPT } from '../ai'

export type CommitType = 'commit' | 'current' | 'future'

export interface GenerateOptions {
  branches: number
  depth: number
  systemPrompt: string
  userPrompt: string
}

export interface Commit {
  id: string
  label: string
  hash: string
  content: string
  type: CommitType
  parents: string[]
  lane: number
  column: number
}

const MOCK_POOL: Array<{ label: string; text: string }> = [
  {
    label: 'far, far away',
    text: 'Far, far away — the signal led him to the edge of the mapped universe, where the stars thinned to nothing.',
  },
  {
    label: 'right next door',
    text: "Right next door — the signal was coming from his neighbor's basement. The light under the door had been on for three days.",
  },
  {
    label: 'quite a bit away',
    text: 'Quite a bit away — three days through asteroid fields stood between Kael and the source. He packed light.',
  },
  {
    label: 'from the past',
    text: 'From the past — the timestamp read 400 years ago. Whatever sent it had been waiting a long time.',
  },
  {
    label: 'a warning',
    text: 'A warning — the same four words, repeating. DO NOT COME HERE.',
  },
  {
    label: 'an invitation',
    text: 'An invitation — just coordinates. Nothing else. Just coordinates and a single blinking cursor.',
  },
]

// Module-level index so repeated generate calls cycle through different pool entries
let poolIndex = 0

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const SEED_COMMITS: Commit[] = [
  {
    id: 'a',
    label: 'initial draft',
    hash: 'a1b2c3',
    type: 'commit',
    parents: [],
    lane: 0,
    column: 0,
    content: '<p>Once upon a time in a galaxy...</p>',
  },
  {
    id: 'b',
    label: 'expanded opening',
    hash: 'b4d5e6',
    type: 'commit',
    parents: ['a'],
    lane: 0,
    column: 1,
    content: '<p>Once upon a time in a galaxy, there lived a young inventor named Kael.</p>',
  },
  {
    id: 'c',
    label: 'added tension',
    hash: 'c7f8a9',
    type: 'current',
    parents: ['b'],
    lane: 0,
    column: 2,
    content:
      '<p>Once upon a time in a galaxy, there lived a young inventor named Kael. One morning, he discovered a signal no one else could hear.</p>',
  },
]

export const useProjectStore = defineStore('project', {
  state: () => ({
    commits: [...SEED_COMMITS] as Commit[],
    activeCommitId: 'c' as string,
    previewCommitId: null as string | null,
    isGenerating: false,
  }),

  getters: {
    activeCommit: (state): Commit =>
      state.commits.find(c => c.id === state.activeCommitId)!,

    previewCommit: (state): Commit | null =>
      state.previewCommitId
        ? (state.commits.find(c => c.id === state.previewCommitId) ?? null)
        : null,

    graphNodes: (state): Commit[] => state.commits,
  },

  actions: {
    setActive(id: string) {
      this.activeCommitId = id
      this.previewCommitId = null
    },

    setPreview(id: string) {
      this.previewCommitId = id
    },

    clearPreview() {
      this.previewCommitId = null
    },

    async generateFutures(options: GenerateOptions) {
      this.isGenerating = true

      const { branches, depth, systemPrompt, userPrompt } = options
      const sourceCommit = this.commits.find(c => c.id === this.activeCommitId)!
      const maxLane = Math.max(...this.commits.map(c => c.lane))
      const baseColumn = Math.max(...this.commits.map(c => c.column))

      // Strip HTML tags to get plain text for the AI
      const sourceText = sourceCommit.content.replace(/<[^>]*>/g, ' ').trim()

      for (let b = 0; b < branches; b++) {
        let currentText = sourceText
        let parentId = sourceCommit.id
        const branchLane = maxLane + 1 + b

        for (let d = 0; d < depth; d++) {
          let prediction: { label: string; content: string }

          try {
            prediction = await generateSingleCompletion(
              systemPrompt,
              userPrompt,
              currentText
            )
          } catch {
            // Fallback to mock pool if API key missing or call fails
            await delay(400)
            const poolItem = MOCK_POOL[poolIndex % MOCK_POOL.length]
            poolIndex++
            prediction = { label: poolItem.label, content: poolItem.text }
          }

          const newId = `future-${Date.now()}-${b}-${d}`
          const newCommit: Commit = {
            id: newId,
            label: prediction.label,
            hash: Math.random().toString(16).slice(2, 8),
            type: 'future',
            parents: [parentId],
            lane: branchLane,
            column: baseColumn + 1 + d,
            // AI returns the full evolved text — use it directly
            content: '<p>' + prediction.content + '</p>',
          }

          this.commits.push(newCommit)

          // Chain: next depth step uses this output as input
          currentText = prediction.content

          // Pause between calls to stay under Gemini free-tier RPM limit
          await delay(3000)
          parentId = newId
        }
      }

      this.isGenerating = false
    },

    adoptPreview() {
      if (!this.previewCommitId) return
      const adoptedId = this.previewCommitId

      // Remove all futures except the adopted one
      this.commits = this.commits.filter(
        c => c.type !== 'future' || c.id === adoptedId,
      )

      // Demote old current → commit
      const oldCurrent = this.commits.find(c => c.type === 'current')
      if (oldCurrent) oldCurrent.type = 'commit'

      // Promote adopted → current
      const adopted = this.commits.find(c => c.id === adoptedId)
      if (adopted) adopted.type = 'current'

      this.activeCommitId = adoptedId
      this.previewCommitId = null
    },
  },
})
