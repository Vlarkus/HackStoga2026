export interface GitAuthor {
  name: string
  email: string
}

export interface CommitInfo {
  oid: string
  message: string
  author: GitAuthor & { timestamp: number }
  parents: string[]
}

export interface BranchInfo {
  name: string
  oid: string
  current: boolean
}

export interface FileDiff {
  oldContent: string | null
  newContent: string | null
  status: 'added' | 'modified' | 'deleted' | 'unmodified'
}

export interface GraphNode {
  oid: string
  message: string
  parents: string[]
  author: GitAuthor & { timestamp: number }
  branches: string[]
}

export interface CommitGraph {
  nodes: GraphNode[]
  branches: BranchInfo[]
  head: string
}

export interface ExportData {
  name: string
  files: Record<string, string>
}
