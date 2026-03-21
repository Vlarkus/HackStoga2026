<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { useEditorPersistence } from '../composables/useEditorPersistence';
import { useProjectStore } from '../stores/useProjectStore';

const store = useProjectStore();
const { save, flush } = useEditorPersistence();

const editor = useEditor({
  content: store.activeCommit.content,
  extensions: [StarterKit],
  onUpdate({ editor }) {
    save(editor.getHTML());
  },
});

defineExpose({ editor });

// Reload content when user clicks a different commit node
watch(
  () => store.activeCommitId,
  () => {
    if (editor.value) {
      editor.value.commands.setContent(store.activeCommit.content);
    }
  },
);

onBeforeUnmount(() => {
  flush();
  editor.value?.destroy();
});
</script>

<template>
  <div :class="$style.root">
    <EditorContent :editor="editor" :class="$style.editorWrap" />
  </div>
</template>

<style module>
.root {
  display: flex;
  flex-direction: column;
  height: 100%;
  user-select: text;
}


.editorWrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  cursor: text;
}

/* Make the ProseMirror div fill the wrapper and be focusable */
.editorWrap :global(.ProseMirror) {
  height: 100%;
  padding: var(--space-3) var(--space-3);
  outline: none;
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-text);
}

/* Reset global typography overrides that break the editor */
.editorWrap :global(p) {
  max-width: none;
  margin: 0 0 var(--space-2);
}

.editorWrap :global(h1) {
  font-size: var(--text-xl);
  margin: var(--space-3) 0 var(--space-2);
}

.editorWrap :global(h2) {
  font-size: var(--text-lg);
  margin: var(--space-3) 0 var(--space-2);
}

.editorWrap :global(ul) {
  padding-left: var(--space-5);
  margin: 0 0 var(--space-2);
}

.editorWrap :global(li) {
  margin-bottom: var(--space-1);
}

/* Placeholder text when editor is empty */
.editorWrap :global(.ProseMirror p.is-editor-empty:first-child::before) {
  content: 'Start writing…';
  color: var(--color-text-muted);
  pointer-events: none;
  float: left;
  height: 0;
}
</style>
