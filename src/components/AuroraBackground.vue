<script setup>
import { computed } from 'vue'
const props = defineProps({ dark: { type: Boolean, default: false } })

// Two distinct moods:
//  • Light → soft pastel aurora (calm, airy)
//  • Dark  → deep vivid nebula glow (dramatic, alive against near-black)
const blobs = computed(() => props.dark
  ? [
      { c: 'rgba(87,70,229,0.55)',  s: 52, x: -12, y: -18, a: 'a1', d: 26 },
      { c: 'rgba(14,165,183,0.42)', s: 46, x: 70,  y: -14, a: 'a2', d: 32 },
      { c: 'rgba(124,58,237,0.50)', s: 50, x: 30,  y: 55,  a: 'a3', d: 30 },
      { c: 'rgba(37,99,235,0.40)',  s: 44, x: -10, y: 68,  a: 'a4', d: 36 },
      { c: 'rgba(20,184,166,0.34)', s: 40, x: 78,  y: 62,  a: 'a5', d: 28 },
    ]
  : [
      { c: 'rgba(99,91,232,0.42)',  s: 50, x: -12, y: -16, a: 'a1', d: 28 },
      { c: 'rgba(56,189,214,0.40)', s: 46, x: 72,  y: -12, a: 'a2', d: 34 },
      { c: 'rgba(139,92,246,0.32)', s: 48, x: 34,  y: 52,  a: 'a3', d: 31 },
      { c: 'rgba(59,130,246,0.34)', s: 42, x: -8,  y: 66,  a: 'a4', d: 38 },
      { c: 'rgba(45,212,191,0.28)', s: 38, x: 80,  y: 60,  a: 'a5', d: 30 },
    ])
</script>

<template>
  <div class="aurora" :class="dark ? 'is-dark' : 'is-light'" aria-hidden="true">
    <div v-for="(b, i) in blobs" :key="i" class="blob" :class="b.a"
      :style="{
        width: b.s + 'vw', height: b.s + 'vw',
        left: b.x + '%', top: b.y + '%',
        background: `radial-gradient(circle at 50% 50%, ${b.c} 0%, transparent 68%)`,
        animationDuration: b.d + 's',
      }" />
  </div>
</template>

<style scoped>
.aurora { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.aurora.is-dark { filter: saturate(1.15); }
.blob {
  position: absolute; border-radius: 50%;
  filter: blur(64px);
  will-change: transform;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}
.is-dark .blob { filter: blur(72px); mix-blend-mode: screen; }

@keyframes a1 { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(7vw,5vh) scale(1.18); } }
@keyframes a2 { 0% { transform: translate(0,0) scale(1.05); } 100% { transform: translate(-6vw,4vh) scale(0.9); } }
@keyframes a3 { 0% { transform: translate(0,0) scale(0.95); } 100% { transform: translate(5vw,-6vh) scale(1.2); } }
@keyframes a4 { 0% { transform: translate(0,0) scale(1.1); } 100% { transform: translate(6vw,-4vh) scale(0.95); } }
@keyframes a5 { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(-7vw,-5vh) scale(1.15); } }
.a1 { animation-name: a1; } .a2 { animation-name: a2; } .a3 { animation-name: a3; }
.a4 { animation-name: a4; } .a5 { animation-name: a5; }

@media (prefers-reduced-motion: reduce) { .blob { animation: none !important; } }
</style>
