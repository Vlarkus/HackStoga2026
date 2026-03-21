# Plan: In-Browser Git Module for Future-Commit

## Context

The "Future-Commit" app lets users write essays/text and version them with AI-generated future branches. **All git operations run client-side** in the browser using `isomorphic-git` + `lightning-fs` (IndexedDB-backed virtual filesystem). The backend handles no git logic — it will later host the AI prediction service.

**Key constraints:**
- Single text file per project (e.g., one essay)
- Persistence: browser IndexedDB only, with manual export/import
- AI integration comes later as a separate service
- Hackathon MVP — full implementation, pragmatic scope

---

## Dependencies

```
npm install --prefix frontend isomorphic-git @nicolo-ribaudo/lightning-fs
```

---

## Folder Structure

```
frontend/src/git/
├── index.ts                — Barrel export (public API)
├── config.ts               — lightning-fs init, repo directory helpers
├── types.ts                — All TypeScript interfaces
└── services/
    ├── repo.ts             — Init/delete/list repos, export/import
    ├── branch.ts           — List/create/delete/checkout branches
    ├── commit.ts           — Create commit, read log, get single commit
    ├── diff.ts             — Diff between two refs (file content comparison)
    ├── merge.ts            — Merge branches, conflict detection
    ├── tree.ts             — Commit graph data for the visualizer
    └── file.ts             — Read/write the project's single text file
```

---

## File-by-File Plan

### 1. `config.ts` — Foundation

- Create a `LightningFS` instance (one per app, stores in IndexedDB)
- Export `fs` object and a helper `getRepoDir(projectName: string) => string`
- Repo convention: `/{projectName}` as the working directory
- Single file convention: the project file is always `/{projectName}/document.txt`

### 2. `types.ts` — Shared Interfaces

```
GitAuthor { name, email }
CommitInfo { oid, message, author, parents, timestamp }
BranchInfo { name, oid, current }
FileDiff { oldContent, newContent, status }
GraphNode { oid, message, parents, author, branches[] }
CommitGraph { nodes, branches, head }
ExportData { name, gitBundle }
```

### 3. `services/repo.ts` — Repository Management

| Function | Purpose |
|----------|---------|
| `initRepo(name)` | `git.init()` + create initial `document.txt` + first commit |
| `listRepos()` | List subdirectories in lightning-fs root |
| `deleteRepo(name)` | Recursively remove repo directory from lightning-fs |
| `exportRepo(name)` | Serialize the `.git` directory contents to a JSON blob for download |
| `importRepo(data)` | Deserialize JSON blob back into lightning-fs, restore repo |

### 4. `services/branch.ts` — Branch Operations

| Function | Purpose |
|----------|---------|
| `listBranches(repo)` | `git.listBranches()` + resolve each to OID + mark current |
| `createBranch(repo, name, startPoint?)` | `git.branch()` from HEAD or specified ref |
| `deleteBranch(repo, name)` | `git.deleteBranch()` |
| `checkout(repo, name)` | `git.checkout()` — switch branch + update working file |
| `getCurrentBranch(repo)` | `git.currentBranch()` |

### 5. `services/file.ts` — Single-File Operations

| Function | Purpose |
|----------|---------|
| `readDocument(repo)` | Read `document.txt` from working directory |
| `writeDocument(repo, content)` | Write content to `document.txt` |
| `readDocumentAtRef(repo, ref)` | `git.readBlob()` to get file at any commit/branch |
| `stageDocument(repo)` | `git.add({ filepath: 'document.txt' })` |

### 6. `services/commit.ts` — Commit Operations

| Function | Purpose |
|----------|---------|
| `createCommit(repo, message, author)` | Write + stage + `git.commit()` |
| `getLog(repo, ref?, depth?)` | `git.log()` — commit history |
| `getCommit(repo, oid)` | Single commit details |

### 7. `services/diff.ts` — Diff Operations

| Function | Purpose |
|----------|---------|
| `diffRefs(repo, fromRef, toRef)` | Read `document.txt` at both refs, return old/new content |
| `hasUncommittedChanges(repo)` | Compare working file against HEAD |

### 8. `services/merge.ts` — Merge Operations

| Function | Purpose |
|----------|---------|
| `mergeBranch(repo, theirs, author, message?)` | `git.merge()` + checkout to update working dir |
| `canMerge(repo, theirs)` | Dry-run merge check |

### 9. `services/tree.ts` — Commit Graph

| Function | Purpose |
|----------|---------|
| `getCommitGraph(repo, depth?)` | Walk all branches' logs, deduplicate by OID, return `GraphNode[]` with branch labels |

### 10. `index.ts` — Barrel Export

Re-exports all service functions and types.

---

## Implementation Order

1. Install dependencies (`isomorphic-git`, `lightning-fs`)
2. `config.ts`
3. `types.ts`
4. `services/file.ts`
5. `services/repo.ts`
6. `services/commit.ts`
7. `services/branch.ts`
8. `services/diff.ts`
9. `services/merge.ts`
10. `services/tree.ts`
11. `index.ts`

## Verification

1. `cd frontend && npm install` — dependencies install cleanly
2. `npm run build` — TypeScript compiles without errors
