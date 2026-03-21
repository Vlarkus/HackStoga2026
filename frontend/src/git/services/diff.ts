import * as git from 'isomorphic-git'
import { fs, getRepoDir, DOCUMENT_FILE } from '../config'
import type { FileDiff } from '../types'

/**
 * Diff the document between two refs (branch names or commit SHAs).
 * Since each project is a single file, this returns one FileDiff.
 */
export async function diffRefs(
  repo: string,
  fromRef: string,
  toRef: string
): Promise<FileDiff> {
  const dir = getRepoDir(repo)

  const fromOid = await git.resolveRef({ fs, dir, ref: fromRef })
  const toOid = await git.resolveRef({ fs, dir, ref: toRef })

  let oldContent: string | null = null
  let newContent: string | null = null

  try {
    const fromBlob = await git.readBlob({
      fs,
      dir,
      oid: fromOid,
      filepath: DOCUMENT_FILE,
    })
    oldContent = new TextDecoder().decode(fromBlob.blob)
  } catch {
    // file didn't exist at fromRef
  }

  try {
    const toBlob = await git.readBlob({
      fs,
      dir,
      oid: toOid,
      filepath: DOCUMENT_FILE,
    })
    newContent = new TextDecoder().decode(toBlob.blob)
  } catch {
    // file didn't exist at toRef
  }

  let status: FileDiff['status']
  if (oldContent === null && newContent !== null) {
    status = 'added'
  } else if (oldContent !== null && newContent === null) {
    status = 'deleted'
  } else if (oldContent !== newContent) {
    status = 'modified'
  } else {
    status = 'unmodified'
  }

  return { oldContent, newContent, status }
}

/**
 * Check if the working directory document differs from HEAD.
 */
export async function hasUncommittedChanges(
  repo: string
): Promise<boolean> {
  const dir = getRepoDir(repo)
  const status = await git.status({ fs, dir, filepath: DOCUMENT_FILE })
  // 'unmodified' means no changes
  return status !== 'unmodified'
}
