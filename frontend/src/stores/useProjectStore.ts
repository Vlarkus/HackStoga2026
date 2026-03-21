import { defineStore } from 'pinia'
import { generateFuturePredictions } from '../ai'
import {
  BUSINESS_CONCEPT,
  HIRING_STRATEGY,
  HIRE_FAST,
  CULTURE_FIRST,
  REMOTE_GLOBAL,
  POOL_TOOL,
  HR_PLATFORM,
  SMART_HOME,
  MERGED_HIRING_PRODUCT,
} from './demoContent'

export type CommitType = 'commit' | 'current' | 'future'

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

export interface Proposal {
  id: string
  sourceId: string
  targetId: string
  summary: string
  status: 'open' | 'approved' | 'rejected'
}

const MOCK_POOL: Array<{ label: string; text: string }> = [
  {
    label: 'pool owners tool',
    text: 'A vertical SaaS platform for pool service companies — scheduling, chemical tracking, equipment logs, and automated dosing recommendations in one place.',
  },
  {
    label: 'AI HR platform',
    text: 'An AI-powered hiring co-pilot for small teams — automated screening, culture-fit scoring, and transparent candidate evaluation at a fraction of recruiter costs.',
  },
  {
    label: 'smart home suite',
    text: 'A unified control hub for multi-property smart home management — fleet-level dashboards, unified automations, and single-stream notifications across all connected devices.',
  },
  {
    label: 'freemium SaaS model',
    text: 'A tiered pricing approach starting with a generous free plan to drive adoption, converting power users to paid tiers through usage-based limits and premium integrations.',
  },
  {
    label: 'enterprise B2B pivot',
    text: 'Targeting enterprise customers with white-label solutions, SSO integration, and dedicated account management — higher ACV, longer sales cycles, but dramatically better retention.',
  },
  {
    label: 'marketplace platform',
    text: 'A two-sided marketplace connecting small business owners with vetted fractional executives — CMOs, CFOs, and COOs available on-demand for strategic planning sprints.',
  },
]

// Module-level index so repeated generate calls cycle through different pool entries
let poolIndex = 0

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const SEED_COMMITS: Commit[] = [
  {
    id: 'biz-concept',
    label: 'business concept',
    hash: 'a1b2c3',
    type: 'commit',
    parents: [],
    lane: 0,
    column: 0,
    content: BUSINESS_CONCEPT,
  },
  {
    id: 'hiring',
    label: 'hiring strategy',
    hash: 'd4e5f6',
    type: 'commit',
    parents: ['biz-concept'],
    lane: 0,
    column: 1,
    content: HIRING_STRATEGY,
  },
  {
    id: 'hire-fast',
    label: 'hire fast, fire fast',
    hash: '7a8b9c',
    type: 'future',
    parents: ['hiring'],
    lane: 1,
    column: 2,
    content: HIRE_FAST,
  },
  {
    id: 'culture',
    label: 'culture-first',
    hash: 'd0e1f2',
    type: 'future',
    parents: ['hiring'],
    lane: 2,
    column: 2,
    content: CULTURE_FIRST,
  },
  {
    id: 'remote',
    label: 'remote-first global',
    hash: '3a4b5c',
    type: 'future',
    parents: ['hiring'],
    lane: 3,
    column: 2,
    content: REMOTE_GLOBAL,
  },
]

export const useProjectStore = defineStore('project', {
  state: () => ({
    projectName: 'FutureCommit',
    branchName: 'main',
    fileName: 'document.txt',
    commits: [...SEED_COMMITS] as Commit[],
    activeCommitId: 'hiring' as string,
    previewCommitId: null as string | null,
    isGenerating: false,
    proposals: [] as Proposal[],
  }),

  getters: {
    activeCommit: (state): Commit =>
      state.commits.find(c => c.id === state.activeCommitId)!,

    previewCommit: (state): Commit | null =>
      state.previewCommitId
        ? (state.commits.find(c => c.id === state.previewCommitId) ?? null)
        : null,

    graphNodes: (state): Commit[] => state.commits,

    openProposals: (state): Proposal[] =>
      state.proposals.filter(p => p.status === 'open'),
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

    async generateFutures(count: number) {
      this.isGenerating = true

      const activeCommit = this.commits.find(c => c.id === this.activeCommitId)!
      const maxLane = Math.max(...this.commits.map(c => c.lane))
      const maxColumn = Math.max(...this.commits.map(c => c.column))
      const newColumn = maxColumn + 1

      // Strip HTML tags to get plain text for the prompt
      const plainText = activeCommit.content.replace(/<[^>]*>/g, ' ').trim()

      let predictions: Array<{ label: string; content: string }>

      try {
        predictions = await generateFuturePredictions(plainText, count)
      } catch {
        // Fallback to mock pool if API key missing or call fails
        await delay(400)
        predictions = []
        for (let i = 0; i < count; i++) {
          const poolItem = MOCK_POOL[poolIndex % MOCK_POOL.length]
          poolIndex++
          predictions.push({ label: poolItem.label, content: poolItem.text })
        }
      }

      for (let i = 0; i < predictions.length; i++) {
        const pred = predictions[i]
        this.commits.push({
          id: `future-${Date.now()}-${i}`,
          label: pred.label,
          hash: Math.random().toString(16).slice(2, 8),
          type: 'future',
          parents: [activeCommit.id],
          lane: maxLane + 1 + i,
          column: newColumn,
          content: activeCommit.content + '<p>' + pred.content + '</p>',
        })
      }

      this.isGenerating = false
    },

    adoptPreview() {
      if (!this.previewCommitId) return
      const adoptedId = this.previewCommitId

      // Demote old current → commit
      const oldCurrent = this.commits.find(c => c.type === 'current')
      if (oldCurrent) oldCurrent.type = 'commit'

      // Promote adopted → current
      const adopted = this.commits.find(c => c.id === adoptedId)
      if (adopted) adopted.type = 'current'

      this.activeCommitId = adoptedId
      this.previewCommitId = null
    },

    createProposal(sourceId: string, targetId: string, summary: string) {
      this.proposals.push({
        id: `proposal-${Date.now()}`,
        sourceId,
        targetId,
        summary,
        status: 'open',
      })
    },

    approveProposal(proposalId: string) {
      const proposal = this.proposals.find(p => p.id === proposalId)
      if (!proposal) return
      proposal.status = 'approved'
      this.mergeInto(proposal.sourceId, proposal.targetId)
    },

    rejectProposal(proposalId: string) {
      const proposal = this.proposals.find(p => p.id === proposalId)
      if (!proposal) return
      proposal.status = 'rejected'
    },

    mergeInto(sourceId: string, targetId: string) {
      const source = this.commits.find(c => c.id === sourceId)
      const target = this.commits.find(c => c.id === targetId)
      if (!source || !target) return

      const maxColumn = Math.max(...this.commits.map(c => c.column))

      const mergeCommit: Commit = {
        id: `merge-${Date.now()}`,
        label: `merged: ${source.label} + ${target.label}`,
        hash: Math.random().toString(16).slice(2, 8),
        type: 'current',
        parents: [targetId, sourceId],
        lane: 0,
        column: maxColumn + 1,
        content: MERGED_HIRING_PRODUCT,
      }

      // Demote old current
      const oldCurrent = this.commits.find(c => c.type === 'current')
      if (oldCurrent) oldCurrent.type = 'commit'

      this.commits.push(mergeCommit)
      this.activeCommitId = mergeCommit.id
      this.previewCommitId = null
    },
  },
})
