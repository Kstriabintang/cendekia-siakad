<script setup>
import { computed } from 'vue'
const props = defineProps({
  tone: { type: String, default: 'neutral' }, // neutral|brand|success|warning|danger|info|gold
  dot: { type: Boolean, default: false },
})
const map = {
  neutral: 'bg-surface-2 text-muted',
  brand: 'text-brand-700 dark:text-brand-600',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  gold: 'text-gold',
}
const bg = {
  neutral: '', brand: 'background: var(--brand-50)', success: 'background: var(--success-soft)',
  warning: 'background: var(--warning-soft)', danger: 'background: var(--danger-soft)',
  info: 'background: var(--info-soft)', gold: 'background: var(--gold-soft)',
}
const cls = computed(() => map[props.tone] || map.neutral)
const style = computed(() => bg[props.tone] || '')
const dotColor = { brand: 'var(--brand-600)', success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)', info: 'var(--info)', gold: 'var(--gold)', neutral: 'var(--faint)' }
</script>

<template>
  <span class="chip" :class="cls" :style="style">
    <span v-if="dot" class="h-1.5 w-1.5 rounded-full" :style="{ background: dotColor[tone] }"></span>
    <slot />
  </span>
</template>
