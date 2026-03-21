<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { useEditorPersistence } from '../composables/useEditorPersistence';

const { load, save, flush } = useEditorPersistence();

const editor = useEditor({
  content: load(),
  extensions: [StarterKit],
  onUpdate({ editor }) {
    save(editor.getHTML());
  },
});

onBeforeUnmount(() => {
  flush();
  editor.value?.destroy();
});
</script>

<template>
  <div :class="$style.root">
    <div v-if="editor" :class="$style.toolbar">
      <button
        :class="[$style.btn, { [$style.active]: editor.isActive('bold') }]"
        @mousedown.prevent="editor.chain().focus().toggleBold().run()"
        title="Bold"
      >B</button>
      <button
        :class="[$style.btn, { [$style.active]: editor.isActive('italic') }]"
        @mousedown.prevent="editor.chain().focus().toggleItalic().run()"
        title="Italic"
      ><em>I</em></button>
      <button
        :class="[$style.btn, { [$style.active]: editor.isActive('heading', { level: 1 }) }]"
        @mousedown.prevent="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        title="Heading 1"
      >H1</button>
      <button
        :class="[$style.btn, { [$style.active]: editor.isActive('heading', { level: 2 }) }]"
        @mousedown.prevent="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        title="Heading 2"
      >H2</button>
      <button
        :class="[$style.btn, { [$style.active]: editor.isActive('bulletList') }]"
        @mousedown.prevent="editor.chain().focus().toggleBulletList().run()"
        title="Bullet list"
      >&#8226;&#8212;</button>
    </div>
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

.toolbar {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-2);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-float);
  flex-shrink: 0;
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
  background: rgba(254, 215, 102, 0.08);
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
