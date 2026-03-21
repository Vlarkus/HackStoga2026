// Types
export type {
  GitAuthor,
  CommitInfo,
  BranchInfo,
  FileDiff,
  GraphNode,
  CommitGraph,
  ExportData,
} from './types'

// Config
export { fs, getRepoDir, DOCUMENT_FILE, getDocumentPath } from './config'

// Services
export {
  initRepo,
  listRepos,
  deleteRepo,
  exportRepo,
  importRepo,
} from './services/repo'

export {
  listBranches,
  createBranch,
  deleteBranch,
  checkout,
  getCurrentBranch,
} from './services/branch'

export {
  createCommit,
  getLog,
  getCommit,
} from './services/commit'

export {
  readDocument,
  writeDocument,
  readDocumentAtRef,
  stageDocument,
} from './services/file'

export { diffRefs, hasUncommittedChanges } from './services/diff'

export { mergeBranch, canMerge } from './services/merge'

export { getCommitGraph } from './services/tree'
