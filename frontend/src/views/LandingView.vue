<template>
  <div class="landing">
    <TransitionOverlay :active="transitioning" />

    <!-- Header -->
    <header class="header">
      <span class="logo">
        <span class="logo-future">FUTURE</span><span class="logo-commit">COMMIT</span>
      </span>
    </header>

    <!-- Hero -->
    <main class="hero">
      <div class="hero-text">
        <span
          v-for="(word, i) in heroWords"
          :key="i"
          class="hero-word"
          :class="{ visible: visibleHeroWords > i, break: word === '\n' }"
        >{{ word === '\n' ? '' : word }}</span>
      </div>

      <p class="sub" :class="{ visible: showSub }">
        A version control system built for those who think ahead.
      </p>
    </main>

    <!-- Critique cards -->
    <section class="cards">
      <div
        v-for="(card, i) in cards"
        :key="i"
        class="card"
        :class="{ visible: visibleCards > i }"
      >
        <span class="card-icon">⚠</span>
        <span class="card-text">{{ card }}</span>
      </div>
    </section>

    <!-- CTA -->
    <div class="cta-wrap" :class="{ visible: showCta }">
      <button class="cta" @click="enter">
        <span class="cta-arrow">→</span> Enter the Future
      </button>
    </div>

    <!-- Background grid -->
    <svg class="bg-grid" aria-hidden="true">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--clr-evergreen-hi)" stroke-width="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TransitionOverlay from '../components/TransitionOverlay.vue';

const transitioning = ref(false);

const heroWords = ['Git', 'tracks', 'the', 'past.', '\n', 'We', 'commit', 'to', 'the', 'future.'];
const visibleHeroWords = ref(0);
const showSub = ref(false);
const visibleCards = ref(0);
const showCta = ref(false);

const cards = [
  'GitHub shows you where you\'ve been. Not where you\'re going.',
  'Every branch is a guess. Make it a prediction.',
  'Merge conflicts are a symptom. Blind commits are the disease.',
  'You cannot see future commits. Until now.',
];

function enter() {
  transitioning.value = true;
}

onMounted(() => {
  // Stagger hero words
  heroWords.forEach((_, i) => {
    setTimeout(() => { visibleHeroWords.value = i + 1; }, 300 + i * 120);
  });

  const heroEnd = 300 + heroWords.length * 120 + 200;

  // Sub headline
  setTimeout(() => { showSub.value = true; }, heroEnd);

  // Cards staggered
  cards.forEach((_, i) => {
    setTimeout(() => { visibleCards.value = i + 1; }, heroEnd + 400 + i * 600);
  });

  // CTA
  setTimeout(() => { showCta.value = true; }, heroEnd + 400 + cards.length * 600 + 200);
});
</script>

<style scoped>
.landing {
  position: relative;
  min-height: 100vh;
  background: var(--clr-evergreen);
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  padding: var(--space-8) var(--space-6);
}

/* Background grid */
.bg-grid {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.6;
}

/* Header */
.header {
  width: 100%;
  max-width: 900px;
  padding: var(--space-4) 0 var(--space-12);
  position: relative;
  z-index: 1;
}
.logo {
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: 800;
  letter-spacing: 0.12em;
}
.logo-future { color: var(--clr-olive); }
.logo-commit { color: var(--clr-mustard); }

/* Hero */
.hero {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 820px;
  margin-bottom: var(--space-12);
}

.hero-text {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 6vw, var(--text-4xl));
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: var(--color-text);
  margin-bottom: var(--space-6);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.3em;
}

.hero-word {
  display: inline-block;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 400ms var(--ease-out), transform 400ms var(--ease-out);
}
.hero-word.visible {
  opacity: 1;
  transform: translateY(0);
}
.hero-word.break {
  width: 100%;
  height: 0;
  margin: 0;
  padding: 0;
}

/* Highlight "future." */
.hero-word:last-child {
  color: var(--clr-mustard);
  text-shadow: 0 0 40px rgba(254, 215, 102, 0.4);
}

.sub {
  font-family: var(--font-mono);
  font-size: var(--text-base);
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 500ms var(--ease-out), transform 500ms var(--ease-out);
}
.sub.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Cards */
.cards {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  max-width: 680px;
  margin-bottom: var(--space-14);
}

.card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  background: var(--clr-evergreen-mid);
  border: 1px solid rgba(254, 215, 102, 0.15);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  box-shadow: var(--glow-commit);
  opacity: 0;
  transform: translateX(-32px);
  transition: opacity 500ms var(--ease-out), transform 500ms var(--ease-out);
}
.card.visible {
  opacity: 1;
  transform: translateX(0);
}

.card-icon {
  font-size: var(--text-base);
  color: var(--clr-mustard);
  flex-shrink: 0;
  margin-top: 1px;
  filter: drop-shadow(0 0 6px var(--clr-mustard));
}

.card-text {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text);
  line-height: 1.6;
}

/* CTA */
.cta-wrap {
  position: relative;
  z-index: 1;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 500ms var(--ease-out), transform 500ms var(--ease-out);
}
.cta-wrap.visible {
  opacity: 1;
  transform: translateY(0);
}

.cta {
  font-family: var(--font-mono);
  font-size: var(--text-md);
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--clr-mustard);
  background: transparent;
  border: 1.5px solid var(--clr-mustard);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-8);
  cursor: pointer;
  transition: background var(--duration-base) var(--ease-out),
              box-shadow var(--duration-base) var(--ease-out),
              transform var(--duration-base) var(--ease-out);
  position: relative;
  overflow: hidden;
}
.cta::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--clr-mustard);
  opacity: 0;
  transition: opacity var(--duration-base) var(--ease-out);
}
.cta:hover {
  box-shadow: 0 0 24px rgba(254, 215, 102, 0.4), 0 0 60px rgba(254, 215, 102, 0.15);
  transform: translateY(-2px);
}
.cta:hover::before {
  opacity: 0.08;
}
.cta:active {
  transform: translateY(0);
}

.cta-arrow {
  display: inline-block;
  transition: transform var(--duration-base) var(--ease-out);
}
.cta:hover .cta-arrow {
  transform: translateX(4px);
}
</style>
