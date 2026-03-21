import * as git from 'isomorphic-git'
import { fs, getRepoDir } from '../config'
import type { BranchInfo } from '../types'

/** List all local branches with their HEAD OIDs */
export async function listBranches(repo: string): Promise<BranchInfo[]> {
  const dir = getRepoDir(repo)
  const names = await git.listBranches({ fs, dir })
  const current = await git.currentBranch({ fs, dir })

  const branches: BranchInfo[] = []
  for (const name of names) {
    const oid = await git.resolveRef({ fs, dir, ref: name })
    branches.push({ name, oid, current: name === current })
  }
  return branches
}

/** Create a new branch, optionally from a specific ref */
export async function createBranch(
  repo: string,
  name: string,
  startPoint?: string
): Promise<void> {
  const dir = getRepoDir(repo)
  await git.branch({ fs, dir, ref: name, object: startPoint })
}

/** Delete a branch */
export async function deleteBranch(
  repo: string,
  name: string
): Promise<void> {
  const dir = getRepoDir(repo)
  await git.deleteBranch({ fs, dir, ref: name })
}

/** Checkout a branch (switches HEAD and updates working directory) */
export async function checkout(
  repo: string,
  name: string
): Promise<void> {
  const dir = getRepoDir(repo)
  await git.checkout({ fs, dir, ref: name })
}

/** Get the name of the current branch (null if detached HEAD) */
export async function getCurrentBranch(
  repo: string
): Promise<string | null> {
  const dir = getRepoDir(repo)
  const branch = await git.currentBranch({ fs, dir })
  return branch ?? null
}
