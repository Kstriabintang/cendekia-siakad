<script setup>
import { computed } from 'vue'
const props = defineProps({
  value: { type: Number, default: 0 }, // 0-100
  size: { type: Number, default: 64 },
  stroke: { type: Number, default: 7 },
  color: { type: String, default: 'var(--brand-600)' },
  label: { type: String, default: null },
})
const r = computed(() => (props.size - props.stroke) / 2)
const circ = computed(() => 2 * Math.PI * r.value)
const offset = computed(() => circ.value * (1 - Math.min(100, Math.max(0, props.value)) / 100))
</script>

<template>
  <div class="relative inline-grid place-items-center" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" class="-rotate-90">
      <circle :cx="size / 2" :cy="size / 2" :r="r" fill="none" :stroke-width="stroke" stroke="var(--surface-2)" />
      <circle :cx="size / 2" :cy="size / 2" :r="r" fill="none" :stroke-width="stroke" :stroke="color"
              stroke-linecap="round" :stroke-dasharray="circ" :stroke-dashoffset="offset"
              style="transition: stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)" />
    </svg>
    <div class="absolute inset-0 grid place-items-center">
      <span class="num font-bold" :style="{ fontSize: size * 0.26 + 'px' }">{{ label ?? value + '%' }}</span>
    </div>
  </div>
</template>
