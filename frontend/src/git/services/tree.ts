import * as git from 'isomorphic-git'
import { fs, getRepoDir } from '../config'
import type { CommitGraph, GraphNode, BranchInfo } from '../types'

/**
 * Build a commit graph spanning all branches.
 * Returns deduplicated nodes with branch labels — ready for the visualizer.
 */
export async function getCommitGraph(
  repo: string,
  depth = 50
): Promise<CommitGraph> {
  const dir = getRepoDir(repo)
  const branchNames = await git.listBranches({ fs, dir })
  const currentBranch = await git.currentBranch({ fs, dir })

  const nodeMap = new Map<string, GraphNode>()
  const branchInfos: BranchInfo[] = []

  for (const name of branchNames) {
    const branchOid = await git.resolveRef({ fs, dir, ref: name })
    branchInfos.push({ name, oid: branchOid, current: name === currentBranch })

    const commits = await git.log({ fs, dir, ref: name, depth })
    for (const entry of commits) {
      const existing = nodeMap.get(entry.oid)
      if (existing) {
        // Commit already seen from another branch — add this branch label
        if (!existing.branches.includes(name)) {
          existing.branches.push(name)
        }
      } else {
        nodeMap.set(entry.oid, {
          oid: entry.oid,
          message: entry.commit.message,
          parents: entry.commit.parent,
          author: {
            name: entry.commit.author.name,
            email: entry.commit.author.email,
            timestamp: entry.commit.author.timestamp,
          },
          branches: [name],
        })
      }
    }
  }

  // Sort nodes by timestamp descending (newest first)
  const nodes = [...nodeMap.values()].sort(
    (a, b) => b.author.timestamp - a.author.timestamp
  )

  const head = await git.resolveRef({ fs, dir, ref: 'HEAD' })

  return { nodes, branches: branchInfos, head }
}
