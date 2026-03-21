# GenerateBar — Inline User Prompt Design

**Date:** 2026-03-21
**Status:** Approved

## Overview

Extend the existing `GenerateBar.vue` with an always-visible, optional user-prompt input that steers AI future-commit generation. The bar stays single-row. The prompt field fills most of the bar width with a floating `DIRECTION` label; the branch counter is integrated as a chip inside the right edge of the input. The GENERATE button remains on the far right and is the sole trigger.

## Layout

Single-row bar, left to right:

```
[ DIRECTION  steer the future…          branches: 3 − + ] [ ◈ GENERATE ]
```

- **Prompt input** — flex-grows to fill available width. Floating label `DIRECTION` at top-left of the input (10px, muted, all-caps monospace). Placeholder text: `steer the future…`. On focus, border brightens to `--color-branch`.
- **`branches: N` chip** — absolutely positioned inside the right edge of the input. Shows `branches: 3` with `−` and `+` micro-buttons. Replaces the standalone counter.
- **GENERATE button** — unchanged; far right; sole trigger for generation.

## Component Changes

### `GenerateBar.vue`

- Add `prompt` ref (`string`, default `''`)
- Remove standalone counter; move counter state into a `branches` ref (same logic: 1–4)
- Render floating-label input with the `branches` chip inside it
- Trim `prompt.value` before passing to the store — a whitespace-only string is treated as empty
- Pass trimmed prompt to `store.generateFutures(count, trimmedPrompt)` on button click
- **Prompt lifetime:** clear `prompt` to `''` when `store.adoptPreview()` is called — the adopted branch represents a committed direction; the old steering prompt is stale
- **Floating label implementation:** `DIRECTION` label is `position: absolute` inside a `position: relative` wrapper, always visible (not animated), top-left corner at `~4px` from the top edge. The `<input>` has `padding-top` set large enough (≈`16px`) so the typed value sits below the label within the `36px` bar height
- **Counter chip tab order:** the `−` and `+` buttons inside the chip use `tabindex="-1"` — they are pointer-only controls. Tab order is: `input → GENERATE button`

### `useProjectStore.ts` — `generateFutures` action

- Add optional second param: `userPrompt?: string`
- `plainText` continues to be derived internally from `activeCommit.content` (unchanged from today) — it is never passed from the component
- Pass `userPrompt` through to `generateFuturePredictions(plainText, count, userPrompt)`
- **Fallback behavior:** when the API call fails and the mock pool is used, `userPrompt` is ignored — mock results are fixed strings unrelated to the prompt; this is acceptable for the fallback path

### `ai.ts` — `generateFuturePredictions`

- Add optional third param: `userPrompt?: string`
- If provided and non-empty after trimming, append to the prompt body:
  `"The user wants the futures to go in this direction: ${userPrompt}"`
- Empty string or absent = no change to prompt; behavior identical to today

## Data Flow

```
GenerateBar (count, prompt — trimmed by component)
  → store.generateFutures(count, userPrompt)
    → plainText derived from activeCommit.content inside action (unchanged)
    → generateFuturePredictions(plainText, count, userPrompt)
      → Gemini API (prompt includes user direction if userPrompt is non-empty)
      → on failure: mock pool fallback (userPrompt ignored in fallback)
```

## Constraints

- Prompt is optional — empty/whitespace string produces identical behavior to current
- Bar height stays 36px — no layout reflow; floating label uses `position: absolute` + input `padding-top`
- Generating state disables input and both counter buttons (same as today for the button)
- Counter `−`/`+` buttons are `tabindex="-1"`; tab order is input → GENERATE
- Prompt clears on `adoptPreview()` — stale steering prompts do not persist across adoptions
- No backend changes required — all prompt handling is in the frontend AI layer
