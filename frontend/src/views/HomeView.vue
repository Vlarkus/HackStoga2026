<script setup lang="ts">
import { useProjectStore } from '../stores/useProjectStore';
import Taskbar from '../components/Taskbar.vue';
import Panel from '../components/Panel.vue';
import MainEditor from '../components/MainEditor.vue';
import GitGraph from '../components/GitGraph.vue';
import GenerateBar from '../components/GenerateBar.vue';
import BranchViewer from '../components/BranchViewer.vue';

const store = useProjectStore();
</script>

<template>
  <div :class="$style.workspace">
    <Taskbar />
    <div :class="$style.canvas">

      <!-- MAIN editor panel -->
      <Panel title="MAIN" accent="commit" :x="20" :y="20" :width="260" :height="580">
        <template #badge><span class="hash">doc</span></template>
        <MainEditor />
      </Panel>

      <!-- Git graph panel -->
      <Panel title="GIT NODES" accent="branch" :x="300" :y="20" :width="720" :height="220">
        <template #badge><span class="badge badge--branch">LIVE</span></template>
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
        :x="300"
        :y="280"
        :width="460"
        :height="320"
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
  min-height: 100%;
  background: var(--color-bg);
}

.canvas {
  position: relative;
  height: calc(100% - 48px);
  min-height: calc(100dvh - 48px);
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
</style>
