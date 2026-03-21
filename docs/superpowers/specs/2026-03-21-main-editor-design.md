# MAIN Editor — Design Spec
**Date:** 2026-03-21
**Status:** Approved

## Summary

Rename the `NOTES` floating panel to `MAIN` and replace its placeholder content with a Tiptap-based WYSIWYG rich text editor. Content persists automatically via `localStorage`.

## Architecture

### New files
- `frontend/src/components/MainEditor.vue` — Tiptap editor + minimal toolbar
- `frontend/src/composables/useEditorPersistence.ts` — localStorage load/save composable

### Modified files
- `frontend/src/views/HomeView.vue` — rename panel title `"NOTES"` → `"MAIN"`, swap placeholder `<p>` for `<MainEditor />`

### Unchanged
- `frontend/src/components/Panel.vue` — no changes; Panel remains a generic draggable/resizable container

## Dependencies

Add to `frontend/package.json`:
- `@tiptap/vue-3`
- `@tiptap/starter-kit`

## Components

### `MainEditor.vue`
- Initializes Tiptap with `StarterKit` extension (covers bold, italic, headings H1/H2, bullet lists)
- Renders a compact toolbar above the editable area with buttons: Bold, Italic, H1, H2, Bullet list
- Toolbar active state highlighted with `--clr-mustard` / `--clr-aqua` CSS vars
- Editor area fills remaining panel height via flexbox
- Calls `useEditorPersistence` for load on mount and save on update

### `useEditorPersistence.ts`
- `load()` — returns `localStorage.getItem('main-editor-content')` (HTML string or null)
- `save(html: string)` — debounced 500ms, writes to `localStorage.setItem('main-editor-content', html)`

## Data Flow

1. `MainEditor` mounts → `load()` → passes HTML to Tiptap `content` option as initial value
2. User types → Tiptap `onUpdate` → `save(html)` debounces 500ms → writes to `localStorage`
3. Page refresh → step 1 restores content
4. No explicit save button — saving is automatic and silent

## Styling

- Toolbar: compact row of buttons using existing CSS vars (`--color-bg-float`, `--color-border`, `--color-text-muted`)
- Active toolbar buttons highlighted with `--clr-mustard` or `--clr-aqua`
- Editor content area: overrides `user-select: none` from Panel with `user-select: text`, `cursor: text`
- Comfortable line-height, inherits workspace font stack
- Toolbar and editor separated by subtle border, consistent with panel header visual rhythm
- No external prose/typography framework — hand-rolled CSS using existing design tokens

## Constraints

- `Panel.vue` sets `user-select: none` globally; `panel-body` must override this inside `MainEditor` for text selection to work
- Editor height must respect Panel's resizable height — flexbox fill with `min-height: 0`
