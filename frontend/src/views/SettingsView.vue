<script setup lang="ts">
import PageShell from '../components/PageShell.vue'
</script>

<template>
  <PageShell title="Settings" subtitle="Configure your workspace">
    <!-- General -->
    <div class="card">
      <h5 :class="$style.sectionTitle">General</h5>
      <div :class="$style.rows">
        <div :class="$style.row">
          <label :class="$style.label">Theme</label>
          <select :class="$style.control">
            <option>Dark Evergreen</option>
            <option>Light</option>
          </select>
        </div>
        <div :class="$style.row">
          <label :class="$style.label">Language</label>
          <select :class="$style.control">
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
          </select>
        </div>
        <div :class="$style.row">
          <label :class="$style.label">Auto-save</label>
          <input type="checkbox" checked :class="$style.toggle" />
        </div>
      </div>
    </div>

    <!-- Editor -->
    <div class="card">
      <h5 :class="$style.sectionTitle">Editor</h5>
      <div :class="$style.rows">
        <div :class="$style.row">
          <label :class="$style.label">Font Size</label>
          <input type="range" min="10" max="24" value="15" :class="$style.slider" />
        </div>
        <div :class="$style.row">
          <label :class="$style.label">Line Numbers</label>
          <input type="checkbox" checked :class="$style.toggle" />
        </div>
        <div :class="$style.row">
          <label :class="$style.label">Word Wrap</label>
          <input type="checkbox" :class="$style.toggle" />
        </div>
      </div>
    </div>

    <!-- Git -->
    <div class="card">
      <h5 :class="$style.sectionTitle">Git</h5>
      <div :class="$style.rows">
        <div :class="$style.row">
          <label :class="$style.label">Default Author Name</label>
          <input type="text" placeholder="Your Name" :class="$style.input" />
        </div>
        <div :class="$style.row">
          <label :class="$style.label">Default Author Email</label>
          <input type="text" placeholder="you@example.com" :class="$style.input" />
        </div>
        <div :class="$style.row">
          <label :class="$style.label">Auto-commit</label>
          <input type="checkbox" :class="$style.toggle" />
        </div>
      </div>
    </div>
  </PageShell>
</template>

<style module>
.sectionTitle {
  margin-bottom: var(--space-4);
  color: var(--color-branch);
  font-size: var(--text-md);
}

.rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
}

.row:last-child {
  border-bottom: none;
}

.label {
  font-size: var(--text-sm);
  color: var(--color-text);
}

.control {
  min-width: 160px;
}

.input {
  min-width: 220px;
}

.slider {
  width: 160px;
  accent-color: var(--color-commit);
}

.toggle {
  accent-color: var(--color-branch);
  width: 18px;
  height: 18px;
  cursor: pointer;
}
</style>
