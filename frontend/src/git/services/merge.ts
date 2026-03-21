import * as git from 'isomorphic-git'
import { fs, getRepoDir } from '../config'
import type { GitAuthor } from '../types'
import type { MergeResult } from 'isomorphic-git'

/**
 * Merge another branch into the current branch.
 * After a successful merge, checks out the current branch to update the working directory.
 */
export async function mergeBranch(
  repo: string,
  theirs: string,
  author: GitAuthor,
  message?: string
): Promise<MergeResult> {
  const dir = getRepoDir(repo)
  const ours = await git.currentBranch({ fs, dir })
  if (!ours) throw new Error('HEAD is detached — cannot merge')

  const result = await git.merge({
    fs,
    dir,
    ours,
    theirs,
    author,
    message: message ?? `Merge branch '${theirs}' into ${ours}`,
    abortOnConflict: true,
  })

  // merge() only updates refs/objects — checkout to sync working directory
  if (!result.alreadyMerged) {
    await git.checkout({ fs, dir, ref: ours })
  }

  return result
}

/**
 * Check if a merge would succeed without actually performing it.
 * Returns the MergeResult from a dry run, or throws if there are conflicts.
 */
export async function canMerge(
  repo: string,
  theirs: string
): Promise<MergeResult> {
  const dir = getRepoDir(repo)
  const ours = await git.currentBranch({ fs, dir })
  if (!ours) throw new Error('HEAD is detached — cannot merge')

  return git.merge({
    fs,
    dir,
    ours,
    theirs,
    dryRun: true,
    author: { name: 'test', email: 'test@test' },
  })
}
