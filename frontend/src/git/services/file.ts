import * as git from 'isomorphic-git'
import { fs, getRepoDir, DOCUMENT_FILE, getDocumentPath } from '../config'

/** Read the document from the working directory */
export async function readDocument(repo: string): Promise<string> {
  const content = await fs.promises.readFile(getDocumentPath(repo), 'utf8')
  return content
}

/** Write content to the document in the working directory */
export async function writeDocument(
  repo: string,
  content: string
): Promise<void> {
  await fs.promises.writeFile(getDocumentPath(repo), content, 'utf8')
}

/** Read the document content at a specific ref (branch name or commit SHA) */
export async function readDocumentAtRef(
  repo: string,
  ref: string
): Promise<string> {
  const dir = getRepoDir(repo)
  const oid = await git.resolveRef({ fs, dir, ref })
  const { blob } = await git.readBlob({ fs, dir, oid, filepath: DOCUMENT_FILE })
  return new TextDecoder().decode(blob)
}

/** Stage the document file */
export async function stageDocument(repo: string): Promise<void> {
  const dir = getRepoDir(repo)
  await git.add({ fs, dir, filepath: DOCUMENT_FILE })
}
