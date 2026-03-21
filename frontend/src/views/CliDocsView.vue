<script setup lang="ts">
import PageShell from '../components/PageShell.vue'

const commands = [
  {
    name: 'fc init',
    desc: 'Initialize a FutureCommit project in the current directory.',
    example: 'fc init --name "my-project"',
  },
  {
    name: 'fc predict',
    desc: 'Generate future branch predictions from the current document state.',
    example: 'fc predict --branches 3',
  },
  {
    name: 'fc adopt',
    desc: 'Adopt a predicted branch and merge it into the main timeline.',
    example: 'fc adopt abc123f',
  },
  {
    name: 'fc status',
    desc: 'Show the current project state, active branches, and pending predictions.',
    example: 'fc status',
  },
]
</script>

<template>
  <PageShell title="CLI Reference" subtitle="Use FutureCommit from the command line">
    <!-- Installation -->
    <div class="card">
      <h5 :class="$style.sectionTitle">Installation</h5>
      <p :class="$style.desc">Install the CLI globally via npm:</p>
      <pre :class="$style.codeBlock">npm install -g @futurecommit/cli</pre>
    </div>

    <!-- Commands -->
    <h5 :class="$style.commandsHeading">Commands</h5>
    <div
      v-for="(cmd, i) in commands"
      :key="i"
      class="card"
      :class="$style.command"
    >
      <code :class="$style.commandName">{{ cmd.name }}</code>
      <p :class="$style.commandDesc">{{ cmd.desc }}</p>
      <pre :class="$style.example">{{ cmd.example }}</pre>
    </div>
  </PageShell>
</template>

<style module>
.sectionTitle {
  margin-bottom: var(--space-4);
  color: var(--color-branch);
  font-size: var(--text-md);
}

.desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}

.codeBlock {
  font-size: var(--text-sm);
  color: var(--color-commit);
}

.commandsHeading {
  font-size: var(--text-md);
  color: var(--color-text);
  font-family: var(--font-display);
}

.command {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: border-color var(--duration-base) var(--ease-out);
}

.command:hover {
  border-color: var(--color-border-mid, var(--color-border));
}

.commandName {
  font-family: var(--font-mono);
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-commit);
}

.commandDesc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.example {
  font-size: var(--text-sm);
  color: var(--color-text);
}
</style>
