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
- `frontend/src/views/HomeView.vue` — rename panel title `"NOTES"` → `"MAIN"`, swap placeholder `<p>` for `<MainEditor />`; `accent="commit"` stays unchanged

### Unchanged
- `frontend/src/components/Panel.vue` — no changes

## Dependencies

Add to `frontend/package.json` (Tiptap v2):
- `@tiptap/vue-3@^2`
- `@tiptap/starter-kit@^2`

No debounce utility needed — hand-rolled via `setTimeout`/`clearTimeout` inside the composable.

Note: `interactjs` is imported in `Panel.vue` but absent from `package.json` — pre-existing issue, out of scope.

## Components

### `MainEditor.vue`

Structure (inside `panel-body` slot, which has `padding: var(--space-4)` and `overflow: auto`):

```
MainEditor root (display:flex flex-direction:column height:100%)
├── Toolbar (flex-shrink:0)
└── Editor div (flex:1 overflow-y:auto min-height:0)
```

- `MainEditor`'s root element must set `height: 100%` explicitly to fill `panel-body`'s computed height (panel-body has `flex: 1`, giving it a computed height; the root bridges into it with `height: 100%`)
- Because the editor fills 100% of `panel-body`'s content area, `panel-body`'s own `overflow: auto` never activates — the Tiptap editor div is the sole scroll owner
- Initializes Tiptap with `StarterKit` at construction time with `content: load()` (the `content` option is set once at init; `null` is a valid value meaning empty editor in Tiptap v2; `setContent()` is never called reactively)
- All StarterKit defaults are acceptable — no extensions disabled; extra node types (blockquote, code block, etc.) remain keyboard-accessible but have no toolbar buttons
- Toolbar buttons: Bold, Italic, H1, H2, Bullet list
- Active toolbar buttons use `--color-commit` CSS var (defined in `global.css` as `var(--clr-mustard)`, `#fed766`)
- `user-select: none` is inherited from `.panel-root`; `MainEditor`'s root element sets `user-select: text` to override
- `cursor: text` is scoped to the Tiptap editor div only (not the root element) to avoid overriding `interact.js` resize cursors on panel edges
- Calls `useEditorPersistence`: `load()` at construction, `save()` on `onUpdate`, `flush()` on `onBeforeUnmount`

### `useEditorPersistence.ts`

- `load(): string | null` — returns `localStorage.getItem('main-editor-content')`; wraps in try/catch, returns `null` on error
- `save(html: string): void` — debounced 500ms via hand-rolled `setTimeout`/`clearTimeout`; writes `localStorage.setItem('main-editor-content', html)`; wraps in try/catch, silently ignores errors
- `flush(): void` — cancels the pending timer and synchronously writes the last `html` value to `localStorage` if a write is pending; called on unmount to prevent last-edit data loss
- `save` and `flush` share a closed-over `timerId` ref and `pendingHtml` ref

## Data Flow

1. `MainEditor` mounts → `load()` → passed as Tiptap `content` option at construction (one-time, not reactive)
2. User types → Tiptap `onUpdate` → `save(html)` resets 500ms timer → on timer fire, writes to `localStorage`
3. Component unmounts (`onBeforeUnmount`) → `flush()` → cancels timer, immediately writes pending HTML
4. Page refresh → step 1 restores content
5. If `localStorage` is unavailable — editor remains fully functional, content does not persist; no user notification

## Styling

- Toolbar: compact row of buttons using `--color-bg-float`, `--color-border`, `--color-text-muted`
- Active toolbar buttons use `--color-commit` (`#fed766` / mustard) from `global.css`
- `MainEditor` root: `user-select: text` to override inherited `user-select: none`; `height: 100%`; `display: flex`; `flex-direction: column`
- Editor div: `overflow-y: auto`, `min-height: 0`, `flex: 1`, `cursor: text`
- Toolbar and editor separated by `border-bottom: 1px solid var(--color-border)`
- The Tiptap editor div must reset several `global.css` rules by scoping overrides inside the editor wrapper:
  - `p { max-width: none }` — overrides the global `65ch` cap
  - `h1 { font-size: var(--text-xl) }` — overrides global 64px; renders at 28px inside the panel
  - `h2 { font-size: var(--text-lg) }` — overrides global 48px; renders at 22px inside the panel
  - These sizes keep headings usable inside the default 260px-wide panel
- No external prose/typography framework — hand-rolled CSS using existing design tokens

## Constraints

- `MainEditor` root: `height: 100%` required to fill `panel-body`'s flex-computed height
- `cursor: text` scoped to editor div only — not root — to avoid conflicting with `interact.js` resize cursors on panel edges
- `p { max-width: none }`, `h1`/`h2` font-size resets must be scoped inside the editor to override global rules
- Tiptap `content` option: `null` → empty editor; `string` → restore saved HTML — set once at construction, never updated reactively
- Debounce uses shared closed-over state (`timerId`, `pendingHtml`) so `flush()` can always access the pending write
- Debounce flushed on `onBeforeUnmount` to prevent last-edit data loss
