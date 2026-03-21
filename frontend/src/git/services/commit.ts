import git from 'isomorphic-git'
import { fs, getRepoDir, DOCUMENT_FILE } from '../config'
import type { GitAuthor, CommitInfo } from '../types'

/**
 * Write the document, stage it, and create a commit.
 * If `content` is provided, writes it first; otherwise commits whatever is staged.
 */
export async function createCommit(
  repo: string,
  message: string,
  author: GitAuthor,
  content?: string
): Promise<string> {
  const dir = getRepoDir(repo)

  if (content !== undefined) {
    await fs.promises.writeFile(`${dir}/${DOCUMENT_FILE}`, content, 'utf8')
    await git.add({ fs, dir, filepath: DOCUMENT_FILE })
  }

  const oid = await git.commit({ fs, dir, message, author })
  return oid
}

/** Get commit log for a ref (defaults to HEAD) */
export async function getLog(
  repo: string,
  ref?: string,
  depth = 50
): Promise<CommitInfo[]> {
  const dir = getRepoDir(repo)
  const commits = await git.log({ fs, dir, ref: ref ?? 'HEAD', depth })
  return commits.map((entry) => ({
    oid: entry.oid,
    message: entry.commit.message,
    author: {
      name: entry.commit.author.name,
      email: entry.commit.author.email,
      timestamp: entry.commit.author.timestamp,
    },
    parents: entry.commit.parent,
  }))
}

/** Get a single commit by OID */
export async function getCommit(
  repo: string,
  oid: string
): Promise<CommitInfo> {
  const dir = getRepoDir(repo)
  const result = await git.readCommit({ fs, dir, oid })
  return {
    oid: result.oid,
    message: result.commit.message,
    author: {
      name: result.commit.author.name,
      email: result.commit.author.email,
      timestamp: result.commit.author.timestamp,
    },
    parents: result.commit.parent,
  }
}
