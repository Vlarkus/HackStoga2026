import LightningFS from '@isomorphic-git/lightning-fs'

const lfs = new LightningFS('future-commit')

/** IndexedDB-backed filesystem for isomorphic-git */
export const fs = lfs

/** Root directory for a project inside the virtual filesystem */
export function getRepoDir(projectName: string): string {
  return `/${projectName}`
}

/** Canonical path to the single document file inside a project */
export const DOCUMENT_FILE = 'document.txt'

export function getDocumentPath(projectName: string): string {
  return `/${projectName}/${DOCUMENT_FILE}`
}
