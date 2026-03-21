<script setup lang="ts">
import { ref } from 'vue';
import { useProjectStore } from '../stores/useProjectStore';
import Taskbar from '../components/Taskbar.vue';
import Panel from '../components/Panel.vue';
import MainEditor from '../components/MainEditor.vue';
import GitGraph from '../components/GitGraph.vue';
import GenerateBar from '../components/GenerateBar.vue';
import BranchViewer from '../components/BranchViewer.vue';
import MergeDialog from '../components/MergeDialog.vue';
import ProposalPanel from '../components/ProposalPanel.vue';

const store = useProjectStore();

const showMergeDialog = ref(false);
const mergeSourceId = ref('');
const showProposals = ref(false);

function handleMerge() {
  if (!store.previewCommitId || !store.activeCommitId) return;
  mergeSourceId.value = store.previewCommitId;
  showMergeDialog.value = true;
}

function handlePropose() {
  if (!store.previewCommitId || !store.activeCommitId) return;
  store.createProposal(
    store.previewCommitId,
    store.activeCommitId,
    `Merge ${store.previewCommit?.label} into ${store.activeCommit.label}`
  );
  showProposals.value = true;
  store.clearPreview();
}
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
        <BranchViewer @merge="handleMerge" @propose="handlePropose" />
      </Panel>

      <!-- Proposals panel -->
      <Panel
        v-if="showProposals || (store.proposals && store.proposals.length > 0)"
        title="PROPOSALS"
        accent="branch"
        :x="500"
        :y="280"
        :width="520"
        :height="320"
      >
        <ProposalPanel />
      </Panel>

    </div>

    <!-- Merge dialog overlay -->
    <MergeDialog
      v-if="showMergeDialog"
      :source-id="mergeSourceId"
      :target-id="store.activeCommitId"
      @close="showMergeDialog = false"
    />
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
