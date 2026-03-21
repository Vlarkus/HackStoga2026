<script setup lang="ts">
import { computed } from 'vue'
import type { FileDiff } from '../git'

const props = defineProps<{ diff: FileDiff }>()

interface DiffLine {
  type: 'same' | 'add' | 'del' | 'info'
  lineOld?: number
  lineNew?: number
  text: string
}

/**
 * Simple line-level diff using a longest-common-subsequence approach.
 * Good enough for single-document essay diffing.
 */
const diffLines = computed((): DiffLine[] => {
  const oldText = props.diff.oldContent ?? ''
  const newText = props.diff.newContent ?? ''

  if (props.diff.status === 'unmodified') {
    return oldText.split('\n').map((t, i) => ({
      type: 'same' as const, lineOld: i + 1, lineNew: i + 1, text: t,
    }))
  }

  if (props.diff.status === 'added') {
    return [
      { type: 'info', text: '--- (new file)' },
      ...newText.split('\n').map((t, i) => ({
        type: 'add' as const, lineNew: i + 1, text: t,
      })),
    ]
  }

  if (props.diff.status === 'deleted') {
    return [
      { type: 'info', text: '--- (file deleted)' },
      ...oldText.split('\n').map((t, i) => ({
        type: 'del' as const, lineOld: i + 1, text: t,
      })),
    ]
  }

  // Modified — compute LCS-based diff
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  return lcs(oldLines, newLines)
})

function lcs(a: string[], b: string[]): DiffLine[] {
  const m = a.length
  const n = b.length

  // Build DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = []
  let i = m, j = n
  const stack: DiffLine[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      stack.push({ type: 'same', lineOld: i, lineNew: j, text: a[i - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: 'add', lineNew: j, text: b[j - 1] })
      j--
    } else {
      stack.push({ type: 'del', lineOld: i, text: a[i - 1] })
      i--
    }
  }

  while (stack.length) result.push(stack.pop()!)
  return result
}

// Stats
const stats = computed(() => {
  let adds = 0, dels = 0
  for (const l of diffLines.value) {
    if (l.type === 'add') adds++
    if (l.type === 'del') dels++
  }
  return { adds, dels }
})
</script>

<template>
  <div :class="$style.wrap">
    <!-- Header -->
    <div :class="$style.header">
      <span :class="$style.status">{{ diff.status }}</span>
      <span v-if="stats.adds" :class="$style.adds">+{{ stats.adds }}</span>
      <span v-if="stats.dels" :class="$style.dels">-{{ stats.dels }}</span>
    </div>

    <!-- Diff lines -->
    <div :class="$style.lines">
      <div
        v-for="(line, idx) in diffLines"
        :key="idx"
        :class="[$style.line, $style[line.type]]"
      >
        <span :class="$style.gutter">{{ line.lineOld ?? '' }}</span>
        <span :class="$style.gutter">{{ line.lineNew ?? '' }}</span>
        <span :class="$style.indicator">
          {{ line.type === 'add' ? '+' : line.type === 'del' ? '-' : line.type === 'info' ? '@' : ' ' }}
        </span>
        <span :class="$style.text">{{ line.text || '\u00A0' }}</span>
      </div>
    </div>
  </div>
</template>

<style module>
.wrap {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
}

.header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-family: system-ui, sans-serif;
  font-size: 0.8rem;
}

.status {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #475569;
}

.adds { color: #16a34a; font-weight: 600; }
.dels { color: #dc2626; font-weight: 600; }

.lines {
  max-height: 360px;
  overflow-y: auto;
  background: white;
}

.line {
  display: flex;
  min-height: 1.6em;
  border-bottom: 1px solid transparent;
}

.line.add {
  background: #dcfce7;
}

.line.del {
  background: #fee2e2;
}

.line.info {
  background: #eff6ff;
  color: #3b82f6;
  font-style: italic;
}

.line.same {
  background: white;
}

.gutter {
  width: 3.5ch;
  min-width: 3.5ch;
  text-align: right;
  padding: 0 0.4ch;
  color: #94a3b8;
  user-select: none;
  border-right: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.indicator {
  width: 2ch;
  min-width: 2ch;
  text-align: center;
  user-select: none;
  flex-shrink: 0;
  font-weight: 700;
}

.add .indicator { color: #16a34a; }
.del .indicator { color: #dc2626; }
.info .indicator { color: #3b82f6; }

.text {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
  padding-right: 0.5rem;
}
</style>
