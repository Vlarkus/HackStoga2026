import git from 'isomorphic-git'
import { fs, getRepoDir, DOCUMENT_FILE, getDocumentPath } from '../config'
import type { ExportData } from '../types'

/** Initialize a new project repository with an empty document */
export async function initRepo(
  name: string,
  defaultBranch = 'main'
): Promise<void> {
  const dir = getRepoDir(name)
  try {
    await fs.promises.mkdir(dir)
  } catch (e: any) {
    if (e.code === 'EEXIST') throw new Error(`Repo "${name}" already exists`)
    throw e
  }
  await git.init({ fs, dir, defaultBranch })

  // Create the initial document and first commit
  await fs.promises.writeFile(getDocumentPath(name), '', 'utf8')
  await git.add({ fs, dir, filepath: DOCUMENT_FILE })
  await git.commit({
    fs,
    dir,
    message: 'Initial commit',
    author: { name: 'Future-Commit', email: 'app@future-commit.local' },
  })
}

/** List all project repositories */
export async function listRepos(): Promise<string[]> {
  const entries = await fs.promises.readdir('/')
  const repos: string[] = []
  for (const entry of entries) {
    try {
      await fs.promises.stat(`/${entry}/.git`)
      repos.push(entry)
    } catch {
      // not a repo, skip
    }
  }
  return repos
}

/** Delete a project repository */
export async function deleteRepo(name: string): Promise<void> {
  const dir = getRepoDir(name)
  await rmrf(dir)
}

/** Recursively remove a directory in lightning-fs */
async function rmrf(dirPath: string): Promise<void> {
  const entries = await fs.promises.readdir(dirPath)
  for (const entry of entries) {
    const fullPath = `${dirPath}/${entry}`
    const stat = await fs.promises.stat(fullPath)
    if (stat.isDirectory()) {
      await rmrf(fullPath)
    } else {
      await fs.promises.unlink(fullPath)
    }
  }
  await fs.promises.rmdir(dirPath)
}

/**
 * Export a repo as a JSON blob containing all files in the .git directory.
 * This allows users to download and later re-import their project.
 */
export async function exportRepo(name: string): Promise<ExportData> {
  const dir = getRepoDir(name)
  const files: Record<string, string> = {}
  await collectFiles(dir, dir, files)
  return { name, files }
}

/** Recursively collect all files as base64-encoded strings */
async function collectFiles(
  basePath: string,
  currentPath: string,
  files: Record<string, string>
): Promise<void> {
  const entries = await fs.promises.readdir(currentPath)
  for (const entry of entries) {
    const fullPath = `${currentPath}/${entry}`
    const relativePath = fullPath.slice(basePath.length + 1)
    const stat = await fs.promises.stat(fullPath)
    if (stat.isDirectory()) {
      await collectFiles(basePath, fullPath, files)
    } else {
      const content = await fs.promises.readFile(fullPath)
      // Store binary data as base64
      if (content instanceof Uint8Array) {
        files[relativePath] = btoa(
          Array.from(content, (b) => String.fromCharCode(b)).join('')
        )
      } else {
        files[relativePath] = btoa(content as string)
      }
    }
  }
}

/** Import a previously exported repo */
export async function importRepo(data: ExportData): Promise<void> {
  const dir = getRepoDir(data.name)

  // Create all directories first, then files
  const dirs = new Set<string>()
  for (const relativePath of Object.keys(data.files)) {
    const parts = relativePath.split('/')
    for (let i = 1; i <= parts.length - 1; i++) {
      dirs.add(`${dir}/${parts.slice(0, i).join('/')}`)
    }
  }

  // Create directories in order (shortest first)
  const sortedDirs = [...dirs].sort((a, b) => a.length - b.length)
  for (const d of sortedDirs) {
    try {
      await fs.promises.mkdir(d)
    } catch {
      // directory may already exist
    }
  }

  // Write files
  for (const [relativePath, base64Content] of Object.entries(data.files)) {
    const fullPath = `${dir}/${relativePath}`
    const binary = atob(base64Content)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    await fs.promises.writeFile(fullPath, bytes)
  }
}
