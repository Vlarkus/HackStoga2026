<script setup lang="ts">
import { computed, ref } from 'vue';
import { useProjectStore } from '../stores/useProjectStore';
import Panel from '../components/Panel.vue';
import MainEditor from '../components/MainEditor.vue';
import GitGraph from '../components/GitGraph.vue';
import GenerateBar from '../components/GenerateBar.vue';
import BranchViewer from '../components/BranchViewer.vue';

const store = useProjectStore();
const mainEditorRef = ref<InstanceType<typeof MainEditor> | null>(null);
const childEditor = computed(() => mainEditorRef.value?.editor?.value);

const GAP = 16;
const vw = window.innerWidth;
const vh = window.innerHeight;

const leftW  = Math.floor(vw * 0.28);
const rightX = leftW + GAP * 2;
const rightW = vw - rightX - GAP;
const panelH = vh - GAP * 2;
const gitH   = Math.floor(panelH * 0.55);
const branchY = GAP + gitH + GAP;
const branchH = panelH - gitH - GAP;
</script>

<template>
  <div :class="$style.workspace">
    <div :class="$style.canvas">

      <!-- MAIN editor panel -->
      <Panel accent="commit" :x="GAP" :y="GAP" :width="leftW" :height="panelH">
        <template #title>
          <div :class="$style.editorHeader">
            <select :class="$style.commitSelect" :value="store.activeCommitId" @change="store.setActive(($event.target as HTMLSelectElement).value)">
              <option v-for="c in store.commits.filter(c => c.type !== 'future')" :key="c.id" :value="c.id">
                {{ c.type === 'current' ? 'MAIN' : c.hash }}
              </option>
            </select>
            <span :class="$style.sep">|</span>
            <div :class="$style.toolbar">
              <button :class="[$style.btn, { [$style.active]: childEditor?.isActive('bold') }]" @mousedown.prevent="childEditor?.chain().focus().toggleBold().run()" title="Bold">B</button>
              <button :class="[$style.btn, { [$style.active]: childEditor?.isActive('italic') }]" @mousedown.prevent="childEditor?.chain().focus().toggleItalic().run()" title="Italic"><em>I</em></button>
              <button :class="[$style.btn, { [$style.active]: childEditor?.isActive('heading', { level: 1 }) }]" @mousedown.prevent="childEditor?.chain().focus().toggleHeading({ level: 1 }).run()" title="Heading 1">H1</button>
              <button :class="[$style.btn, { [$style.active]: childEditor?.isActive('heading', { level: 2 }) }]" @mousedown.prevent="childEditor?.chain().focus().toggleHeading({ level: 2 }).run()" title="Heading 2">H2</button>
              <button :class="[$style.btn, { [$style.active]: childEditor?.isActive('bulletList') }]" @mousedown.prevent="childEditor?.chain().focus().toggleBulletList().run()" title="Bullet list">&#8226;&#8212;</button>
            </div>
          </div>
        </template>
        <MainEditor ref="mainEditorRef" />
      </Panel>

      <!-- Git graph panel -->
      <Panel title="NODES" accent="branch" :x="rightX" :y="GAP" :width="rightW" :height="gitH">

        <GitGraph />
        <template #footer>
          <GenerateBar />
        </template>
      </Panel>

      <!-- Branch viewer: shown when a future node is selected -->
      <Panel
        v-if="store.previewCommitId"
        title="BRANCH ◈ VIEWER"
        accent="branch"
        :x="rightX"
        :y="branchY"
        :width="rightW"
        :height="branchH"
      >
        <template #badge>
          <button :class="$style.closeBtn" @click="store.clearPreview()">×</button>
        </template>
        <BranchViewer />
      </Panel>

    </div>
  </div>
</template>

<style module>
.workspace {
  min-height: 100dvh;
  background: var(--color-bg);
}

.canvas {
  position: relative;
  height: 100dvh;
  overflow: hidden;
}

.closeBtn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-size: var(--text-base);
  cursor: pointer;
  padding: 0 var(--space-1);
  line-height: 1;
  transition: color var(--duration-fast);
}

.closeBtn:hover {
  color: var(--color-text);
}

.editorHeader {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.sep {
  color: var(--color-border);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  user-select: none;
}

.toolbar {
  display: flex;
  gap: var(--space-1);
}

.btn {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  line-height: 1;
  transition: color var(--duration-base), border-color var(--duration-base),
              background var(--duration-base);
}

.btn:hover {
  color: var(--color-text);
  border-color: var(--color-border);
}

.active {
  color: var(--color-commit);
  border-color: var(--color-commit);
  background: rgba(var(--clr-mustard-rgb), 0.08);
}

.commitSelect {
  background: var(--color-bg-float);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.12em;
  padding: 2px var(--space-1);
  cursor: pointer;
  outline: none;
}

.commitSelect option {
  background: var(--color-bg-float);
  color: var(--color-text);
}

.commitSelect:hover {
  border-color: var(--clr-mustard);
  color: var(--color-text);
}
</style>
