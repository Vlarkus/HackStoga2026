<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import CommitGraphViz from '../components/CommitGraphViz.vue'
import DiffView from '../components/DiffView.vue'
import {
  initRepo,
  listRepos,
  deleteRepo,
  exportRepo,
  importRepo,
  listBranches,
  createBranch,
  deleteBranch,
  checkout,
  getCurrentBranch,
  createCommit,
  getLog,
  getCommit,
  readDocument,
  writeDocument,
  readDocumentAtRef,
  hasUncommittedChanges,
  diffRefs,
  mergeBranch,
  canMerge,
  getCommitGraph,
  type GitAuthor,
  type CommitInfo,
  type BranchInfo,
  type CommitGraph,
  type FileDiff,
} from '../git'

// ── State ──
const author = reactive<GitAuthor>({ name: 'Test User', email: 'test@example.com' })

const repos = ref<string[]>([])
const activeRepo = ref<string | null>(null)
const newRepoName = ref('my-essay')

const branches = ref<BranchInfo[]>([])
const currentBranch = ref<string | null>(null)
const newBranchName = ref('')
const mergeBranchName = ref('')

const documentContent = ref('')
const commitMessage = ref('')
const commitLog = ref<CommitInfo[]>([])

const graph = ref<CommitGraph | null>(null)

const diffFrom = ref('')
const diffTo = ref('')
const diffResult = ref<FileDiff | null>(null)

const selectedCommit = ref<CommitInfo | null>(null)
const selectedCommitContent = ref<string | null>(null)

const hasChanges = ref(false)
const logs = ref<string[]>([])
const quickTestRunning = ref(false)

// ── Logging ──
function log(msg: string, type: 'info' | 'error' | 'success' = 'info') {
  const prefix = type === 'error' ? 'ERR' : type === 'success' ? 'OK ' : '...'
  logs.value.unshift(`[${prefix}] ${msg}`)
  if (logs.value.length > 100) logs.value.pop()
}

// ── Repo Operations ──
async function refreshRepos() {
  repos.value = await listRepos()
}

async function handleInitRepo() {
  const name = newRepoName.value.trim()
  if (!name) return
  try {
    await initRepo(name)
    log(`Created repo "${name}"`, 'success')
    await refreshRepos()
    await selectRepo(name)
  } catch (e: any) {
    log(`Init failed: ${e.message}`, 'error')
  }
}

async function handleDeleteRepo(name: string) {
  try {
    await deleteRepo(name)
    log(`Deleted repo "${name}"`, 'success')
    if (activeRepo.value === name) {
      activeRepo.value = null
      branches.value = []
      commitLog.value = []
      documentContent.value = ''
      graph.value = null
    }
    await refreshRepos()
  } catch (e: any) {
    log(`Delete failed: ${e.message}`, 'error')
  }
}

async function handleExport() {
  if (!activeRepo.value) return
  try {
    const data = await exportRepo(activeRepo.value)
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeRepo.value}.json`
    a.click()
    URL.revokeObjectURL(url)
    log('Exported repo as JSON', 'success')
  } catch (e: any) {
    log(`Export failed: ${e.message}`, 'error')
  }
}

async function handleImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    await importRepo(data)
    log(`Imported repo "${data.name}"`, 'success')
    await refreshRepos()
    await selectRepo(data.name)
  } catch (e: any) {
    log(`Import failed: ${e.message}`, 'error')
  }
  input.value = ''
}

// ── Select & Refresh ──
async function selectRepo(name: string) {
  activeRepo.value = name
  selectedCommit.value = null
  selectedCommitContent.value = null
  diffResult.value = null
  await refreshAll()
}

async function refreshAll() {
  if (!activeRepo.value) return
  try {
    await refreshBranches()
    await refreshDocument()
    await refreshLog()
    await refreshGraph()
    await checkChanges()
  } catch (e: any) {
    log(`Refresh error: ${e.message}`, 'error')
  }
}

async function refreshBranches() {
  if (!activeRepo.value) return
  branches.value = await listBranches(activeRepo.value)
  currentBranch.value = await getCurrentBranch(activeRepo.value)
}

async function refreshDocument() {
  if (!activeRepo.value) return
  try {
    documentContent.value = await readDocument(activeRepo.value)
  } catch {
    documentContent.value = ''
  }
}

async function refreshLog() {
  if (!activeRepo.value) return
  commitLog.value = await getLog(activeRepo.value, undefined, 30)
}

async function refreshGraph() {
  if (!activeRepo.value) return
  graph.value = await getCommitGraph(activeRepo.value, 30)
}

async function checkChanges() {
  if (!activeRepo.value) return
  hasChanges.value = await hasUncommittedChanges(activeRepo.value)
}

// ── Document ──
async function handleSaveDocument() {
  if (!activeRepo.value) return
  try {
    await writeDocument(activeRepo.value, documentContent.value)
    await checkChanges()
    log('Document saved to working directory', 'success')
  } catch (e: any) {
    log(`Save failed: ${e.message}`, 'error')
  }
}

// ── Commits ──
async function handleCommit() {
  if (!activeRepo.value || !commitMessage.value.trim()) return
  try {
    const oid = await createCommit(
      activeRepo.value,
      commitMessage.value,
      author,
      documentContent.value
    )
    log(`Committed ${oid.slice(0, 7)}: "${commitMessage.value}"`, 'success')
    commitMessage.value = ''
    await refreshLog()
    await refreshGraph()
    await refreshBranches()
    await checkChanges()
  } catch (e: any) {
    log(`Commit failed: ${e.message}`, 'error')
  }
}

// ── Inspect commit ──
async function handleSelectCommit(oid: string) {
  if (!activeRepo.value) return
  try {
    const info = await getCommit(activeRepo.value, oid)
    selectedCommit.value = info
    selectedCommitContent.value = await readDocumentAtRef(activeRepo.value, oid)
    log(`Inspecting commit ${oid.slice(0, 7)}`, 'info')
  } catch (e: any) {
    log(`Inspect failed: ${e.message}`, 'error')
  }
}

// ── Branches ──
async function handleCreateBranch() {
  if (!activeRepo.value || !newBranchName.value.trim()) return
  try {
    await createBranch(activeRepo.value, newBranchName.value)
    log(`Created branch "${newBranchName.value}"`, 'success')
    newBranchName.value = ''
    await refreshBranches()
    await refreshGraph()
  } catch (e: any) {
    log(`Branch creation failed: ${e.message}`, 'error')
  }
}

async function handleCheckout(name: string) {
  if (!activeRepo.value) return
  try {
    await checkout(activeRepo.value, name)
    log(`Checked out "${name}"`, 'success')
    await refreshAll()
  } catch (e: any) {
    log(`Checkout failed: ${e.message}`, 'error')
  }
}

async function handleDeleteBranch(name: string) {
  if (!activeRepo.value) return
  try {
    await deleteBranch(activeRepo.value, name)
    log(`Deleted branch "${name}"`, 'success')
    await refreshBranches()
    await refreshGraph()
  } catch (e: any) {
    log(`Delete branch failed: ${e.message}`, 'error')
  }
}

// ── Merge ──
async function handleCheckMerge() {
  if (!activeRepo.value || !mergeBranchName.value.trim()) return
  try {
    const result = await canMerge(activeRepo.value, mergeBranchName.value)
    if (result.alreadyMerged) {
      log(`Already merged with "${mergeBranchName.value}"`, 'info')
    } else {
      log(`Merge OK — fastForward: ${!!result.fastForward}`, 'success')
    }
  } catch (e: any) {
    log(`Merge check failed: ${e.message}`, 'error')
  }
}

async function handleMerge() {
  if (!activeRepo.value || !mergeBranchName.value.trim()) return
  try {
    const result = await mergeBranch(activeRepo.value, mergeBranchName.value, author)
    if (result.alreadyMerged) {
      log(`Already merged with "${mergeBranchName.value}"`, 'info')
    } else {
      log(`Merged "${mergeBranchName.value}" -> ${result.oid?.slice(0, 7)}`, 'success')
    }
    mergeBranchName.value = ''
    await refreshAll()
  } catch (e: any) {
    log(`Merge failed: ${e.message}`, 'error')
  }
}

// ── Diff ──
async function handleDiff() {
  if (!activeRepo.value || !diffFrom.value || !diffTo.value) return
  try {
    diffResult.value = await diffRefs(activeRepo.value, diffFrom.value, diffTo.value)
    log(`Diff ${diffFrom.value}..${diffTo.value}: ${diffResult.value.status}`, 'success')
  } catch (e: any) {
    log(`Diff failed: ${e.message}`, 'error')
    diffResult.value = null
  }
}

// ── Quick Test: auto-run a branching scenario ──
async function runQuickTest() {
  quickTestRunning.value = true
  const name = `test-${Date.now()}`
  try {
    log('--- QUICK TEST START ---', 'info')

    // 1. Init repo
    await initRepo(name)
    log(`initRepo("${name}")`, 'success')
    await refreshRepos()
    await selectRepo(name)

    // 2. First real commit on main
    await createCommit(name, 'Write intro paragraph', author, 'The quick brown fox jumps over the lazy dog.\nThis is the beginning of our story.')
    log('Committed intro on main', 'success')

    // 3. Create feature branch
    await createBranch(name, 'draft-v2')
    log('Created branch draft-v2', 'success')

    // 4. Add another commit on main
    await createCommit(name, 'Add second paragraph', author, 'The quick brown fox jumps over the lazy dog.\nThis is the beginning of our story.\n\nThe fox continued through the forest, passing ancient oaks.')
    log('Committed second paragraph on main', 'success')

    // 5. Switch to draft-v2 and diverge
    await checkout(name, 'draft-v2')
    log('Checked out draft-v2', 'success')
    await createCommit(name, 'Rewrite intro (v2)', author, 'A swift auburn fox leaps gracefully over a sleepy hound.\nThus begins our tale of the enchanted forest.')
    log('Committed rewrite on draft-v2', 'success')

    await createCommit(name, 'Add dramatic ending (v2)', author, 'A swift auburn fox leaps gracefully over a sleepy hound.\nThus begins our tale of the enchanted forest.\n\nAnd so, the forest whispered secrets only the fox could hear.')
    log('Committed ending on draft-v2', 'success')

    // 6. Create another branch from main
    await checkout(name, 'main')
    await createBranch(name, 'experimental')
    await checkout(name, 'experimental')
    await createCommit(name, 'Wild experimental rewrite', author, 'ONCE UPON A TIME in a land of code and commits...\nEverything was version controlled.\n\nThe end. Or was it?')
    log('Committed experimental branch', 'success')

    // 7. Back to main
    await checkout(name, 'main')

    // 8. Set up diff refs
    diffFrom.value = 'main'
    diffTo.value = 'draft-v2'
    await handleDiff()

    await refreshAll()
    log('--- QUICK TEST COMPLETE ---', 'success')
    log('Try: checkout branches, merge, inspect commits', 'info')
  } catch (e: any) {
    log(`Quick test failed: ${e.message}`, 'error')
  }
  quickTestRunning.value = false
}

onMounted(async () => {
  await refreshRepos()
  log('Git Playground ready', 'info')
})
</script>

<template>
  <div :class="$style.playground">
    <!-- HEADER -->
    <header :class="$style.header">
      <div :class="$style.headerLeft">
        <h1 :class="$style.title">Git Playground</h1>
        <span v-if="activeRepo" :class="$style.repoBadge">{{ activeRepo }}</span>
        <span v-if="currentBranch" :class="$style.branchBadge">{{ currentBranch }}</span>
      </div>
      <div :class="$style.headerRight">
        <button :class="$style.btnAccent" @click="runQuickTest" :disabled="quickTestRunning">
          {{ quickTestRunning ? 'Running...' : 'Quick Test' }}
        </button>
        <div :class="$style.authorRow">
          <input v-model="author.name" placeholder="Name" :class="$style.inputSm" />
          <input v-model="author.email" placeholder="Email" :class="$style.inputSm" />
        </div>
      </div>
    </header>

    <div :class="$style.layout">
      <!-- LEFT: Controls -->
      <aside :class="$style.sidebar">
        <!-- Repos -->
        <section :class="$style.card">
          <h2>Repositories</h2>
          <div :class="$style.row">
            <input v-model="newRepoName" placeholder="repo name" :class="$style.input" @keyup.enter="handleInitRepo" />
            <button :class="$style.btnPrimary" @click="handleInitRepo">Init</button>
          </div>
          <ul :class="$style.list">
            <li v-for="r in repos" :key="r" :class="[$style.listItem, r === activeRepo && $style.active]">
              <button :class="$style.btnLink" @click="selectRepo(r)">{{ r }}</button>
              <button :class="$style.btnDanger" @click="handleDeleteRepo(r)" title="Delete repo">&times;</button>
            </li>
          </ul>
          <div v-if="activeRepo" :class="$style.row" style="margin-top:0.5rem">
            <button :class="$style.btnSecondary" @click="handleExport">Export</button>
            <label :class="[$style.btnSecondary, $style.fileLabel]">
              Import
              <input type="file" accept=".json" @change="handleImport" />
            </label>
          </div>
          <p v-if="repos.length === 0" :class="$style.muted">No repos yet.</p>
        </section>

        <!-- Branches -->
        <section v-if="activeRepo" :class="$style.card">
          <h2>Branches</h2>
          <div :class="$style.row">
            <input v-model="newBranchName" placeholder="new branch" :class="$style.input" @keyup.enter="handleCreateBranch" />
            <button :class="$style.btnPrimary" @click="handleCreateBranch">+</button>
          </div>
          <ul :class="$style.list">
            <li v-for="b in branches" :key="b.name" :class="[$style.listItem, b.current && $style.active]">
              <button :class="$style.btnLink" @click="handleCheckout(b.name)">
                <span :class="$style.branchIcon">{{ b.current ? '>' : ' ' }}</span>
                {{ b.name }}
                <span :class="$style.oid">{{ b.oid.slice(0, 7) }}</span>
              </button>
              <button v-if="!b.current" :class="$style.btnDanger" @click="handleDeleteBranch(b.name)">&times;</button>
            </li>
          </ul>
        </section>

        <!-- Merge -->
        <section v-if="activeRepo" :class="$style.card">
          <h2>Merge into {{ currentBranch }}</h2>
          <div :class="$style.row">
            <select v-model="mergeBranchName" :class="$style.input">
              <option value="" disabled>pick branch...</option>
              <option v-for="b in branches.filter(b => !b.current)" :key="b.name" :value="b.name">{{ b.name }}</option>
            </select>
          </div>
          <div :class="$style.row">
            <button :class="$style.btnSecondary" @click="handleCheckMerge" :disabled="!mergeBranchName">Dry run</button>
            <button :class="$style.btnPrimary" @click="handleMerge" :disabled="!mergeBranchName">Merge</button>
          </div>
        </section>

        <!-- Commit Log (compact) -->
        <section v-if="activeRepo" :class="$style.card">
          <h2>Commit Log</h2>
          <ul :class="$style.logList">
            <li
              v-for="c in commitLog"
              :key="c.oid"
              :class="[$style.logItem, selectedCommit?.oid === c.oid && $style.selected]"
              @click="handleSelectCommit(c.oid)"
            >
              <span :class="$style.oid">{{ c.oid.slice(0, 7) }}</span>
              <span :class="$style.logMsg">{{ c.message }}</span>
            </li>
          </ul>
          <p v-if="commitLog.length === 0" :class="$style.muted">No commits yet.</p>
        </section>
      </aside>

      <!-- CENTER: Editor + Commit + Visualizations -->
      <main v-if="activeRepo" :class="$style.center">
        <!-- Document Editor -->
        <section :class="$style.card">
          <h2>
            Document
            <span v-if="hasChanges" :class="$style.badgeWarn">modified</span>
          </h2>
          <textarea
            v-model="documentContent"
            :class="$style.editor"
            placeholder="Start writing your essay..."
          />
          <div :class="$style.row">
            <button :class="$style.btnSecondary" @click="handleSaveDocument">Save</button>
            <input v-model="commitMessage" placeholder="commit message..." :class="$style.input" @keyup.enter="handleCommit" />
            <button :class="$style.btnPrimary" @click="handleCommit" :disabled="!commitMessage.trim()">Commit</button>
          </div>
        </section>

        <!-- Commit Graph Visualization -->
        <section :class="$style.card">
          <h2>Commit Graph</h2>
          <CommitGraphViz
            v-if="graph && graph.nodes.length > 0"
            :graph="graph"
            @select-commit="handleSelectCommit"
          />
          <p v-else :class="$style.muted">No graph data yet.</p>
        </section>

        <!-- Diff Viewer -->
        <section :class="$style.card">
          <h2>Diff</h2>
          <div :class="$style.row">
            <select v-model="diffFrom" :class="$style.input">
              <option value="" disabled>from...</option>
              <option v-for="b in branches" :key="b.name" :value="b.name">{{ b.name }}</option>
            </select>
            <span :class="$style.arrow">-></span>
            <select v-model="diffTo" :class="$style.input">
              <option value="" disabled>to...</option>
              <option v-for="b in branches" :key="b.name" :value="b.name">{{ b.name }}</option>
            </select>
            <button :class="$style.btnPrimary" @click="handleDiff" :disabled="!diffFrom || !diffTo">Diff</button>
          </div>
          <DiffView v-if="diffResult" :diff="diffResult" />
        </section>
      </main>

      <!-- RIGHT: Inspect Panel -->
      <aside v-if="activeRepo" :class="$style.inspectPanel">
        <section :class="$style.card">
          <h2>Inspect</h2>
          <template v-if="selectedCommit">
            <div :class="$style.inspectGrid">
              <span :class="$style.inspectLabel">OID</span>
              <span :class="$style.oid">{{ selectedCommit.oid.slice(0, 12) }}</span>

              <span :class="$style.inspectLabel">Message</span>
              <span>{{ selectedCommit.message }}</span>

              <span :class="$style.inspectLabel">Author</span>
              <span>{{ selectedCommit.author.name }}</span>

              <span :class="$style.inspectLabel">Date</span>
              <span>{{ new Date(selectedCommit.author.timestamp * 1000).toLocaleString() }}</span>

              <span :class="$style.inspectLabel">Parents</span>
              <span>
                <span v-for="p in selectedCommit.parents" :key="p" :class="$style.oid" style="margin-right:4px">
                  {{ p.slice(0, 7) }}
                </span>
                <span v-if="selectedCommit.parents.length === 0" :class="$style.muted">root</span>
              </span>
            </div>

            <h3 :class="$style.inspectSubhead">Document at this commit</h3>
            <pre :class="$style.inspectPre">{{ selectedCommitContent ?? '(empty)' }}</pre>
          </template>
          <p v-else :class="$style.muted">Click a commit in the graph or log to inspect it.</p>
        </section>
      </aside>
    </div>

    <!-- FOOTER: Activity Log -->
    <footer :class="$style.footer">
      <div :class="$style.footerHeader">
        <h3>Activity Log</h3>
        <button :class="$style.btnDanger" @click="logs = []">Clear</button>
      </div>
      <div :class="$style.logConsole">
        <div v-for="(entry, i) in logs" :key="i" :class="[
          $style.logEntry,
          entry.startsWith('[ERR]') && $style.logError,
          entry.startsWith('[OK ]') && $style.logOk,
        ]">{{ entry }}</div>
      </div>
    </footer>
  </div>
</template>

<style module>
.playground {
  max-width: 1600px;
  margin: 0 auto;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-height: 100vh;
}

/* ── Header ── */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid #e2e8f0;
}
.headerLeft { display: flex; align-items: center; gap: 0.75rem; }
.headerRight { display: flex; align-items: center; gap: 0.75rem; }
.title { font-size: 1.35rem; font-weight: 700; }
.repoBadge {
  font-size: 0.8rem;
  background: #1e293b;
  color: #e2e8f0;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-family: monospace;
}
.branchBadge {
  font-size: 0.8rem;
  background: #6366f1;
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
}
.authorRow {
  display: flex;
  gap: 0.35rem;
  font-size: 0.85rem;
}

/* ── Layout ── */
.layout {
  display: grid;
  grid-template-columns: 260px 1fr 280px;
  gap: var(--spacing-md);
  flex: 1;
}
.sidebar, .inspectPanel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  overflow-y: auto;
  max-height: calc(100vh - 180px);
}
.center {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* ── Card ── */
.card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: var(--spacing-md);
}
.card h2 {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #475569;
  margin-bottom: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* ── Shared UI ── */
.row {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  margin-bottom: var(--spacing-sm);
}
.input, .inputSm {
  padding: 0.375rem 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: inherit;
  background: white;
  flex: 1;
}
.inputSm { width: 110px; flex: none; }
.input:focus, .inputSm:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.15);
}

.btnPrimary, .btnSecondary, .btnDanger, .btnLink, .btnAccent {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.btnPrimary { background: var(--color-primary); color: white; }
.btnPrimary:hover { background: var(--color-primary-hover); }
.btnPrimary:disabled { opacity: 0.5; cursor: default; }
.btnSecondary { background: #e2e8f0; color: #334155; }
.btnSecondary:hover { background: #cbd5e1; }
.btnAccent { background: #10b981; color: white; font-weight: 600; }
.btnAccent:hover { background: #059669; }
.btnAccent:disabled { opacity: 0.5; cursor: default; }
.btnDanger { background: transparent; color: #ef4444; padding: 0.25rem 0.5rem; font-weight: 700; }
.btnDanger:hover { background: #fef2f2; }
.btnLink { background: transparent; color: var(--color-text); padding: 0.25rem 0; text-align: left; flex: 1; display: flex; align-items: center; gap: 0.35rem; }
.btnLink:hover { color: var(--color-primary); }
.fileLabel { cursor: pointer; }
.fileLabel input { display: none; }

.list { list-style: none; padding: 0; }
.listItem {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}
.listItem.active { background: #e0e7ff; }

.branchIcon {
  font-family: monospace;
  font-weight: 700;
  width: 1ch;
  color: var(--color-primary);
}

.oid {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.75rem;
  color: #6366f1;
  background: #eef2ff;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
}
.muted { color: #94a3b8; font-size: 0.8rem; font-style: italic; }
.arrow { color: #94a3b8; font-weight: 600; }
.badgeWarn {
  font-size: 0.65rem;
  background: #f59e0b;
  color: white;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
}

/* ── Editor ── */
.editor {
  width: 100%;
  min-height: 200px;
  padding: var(--spacing-md);
  font-family: 'Georgia', serif;
  font-size: 1rem;
  line-height: 1.8;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  resize: vertical;
  margin-bottom: var(--spacing-sm);
  background: white;
}
.editor:focus { outline: none; border-color: var(--color-primary); }

/* ── Log list ── */
.logList { list-style: none; padding: 0; max-height: 240px; overflow-y: auto; }
.logItem {
  display: flex;
  gap: 0.35rem;
  align-items: baseline;
  padding: 0.3rem 0.4rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.8rem;
  cursor: pointer;
  border-radius: 3px;
}
.logItem:hover { background: #f1f5f9; }
.logItem.selected { background: #e0e7ff; }
.logMsg { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── Inspect panel ── */
.inspectGrid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.35rem 0.75rem;
  font-size: 0.8rem;
  margin-bottom: var(--spacing-md);
}
.inspectLabel { font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.04em; }
.inspectSubhead { font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 0.35rem; }
.inspectPre {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: var(--spacing-sm);
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Georgia', serif;
  line-height: 1.6;
}

/* ── Footer ── */
.footer { border-top: 2px solid #e2e8f0; padding-top: var(--spacing-md); }
.footerHeader { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm); }
.footerHeader h3 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
.logConsole {
  background: #0f172a;
  color: #cbd5e1;
  border-radius: 6px;
  padding: var(--spacing-sm) var(--spacing-md);
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.75rem;
  max-height: 140px;
  overflow-y: auto;
}
.logEntry { padding: 0.15rem 0; border-bottom: 1px solid #1e293b; }
.logError { color: #f87171; }
.logOk { color: #4ade80; }
</style>
