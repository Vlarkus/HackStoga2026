<script setup lang="ts">
import Taskbar from '../components/Taskbar.vue';
import Panel from '../components/Panel.vue';
import MainEditor from '../components/MainEditor.vue';
import GitGraph from '../components/GitGraph.vue';
</script>

<template>
  <div :class="$style.workspace">
    <Taskbar />
    <div :class="$style.canvas">

      <Panel title="MAIN" accent="commit" :x="20" :y="20" :width="260" :height="580">
        <template #badge><span class="hash">doc</span></template>
        <MainEditor />
      </Panel>

      <Panel title="GIT NODES" accent="branch" :x="300" :y="20" :width="720" :height="220">
        <template #badge><span class="badge badge--branch">LIVE</span></template>
        <GitGraph />
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
  height: calc(100dvh - 48px);
  margin-top: 48px;
  overflow: hidden;
}
</style>
