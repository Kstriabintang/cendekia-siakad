<script setup>
import { computed } from 'vue'
const props = defineProps({
  data: { type: Array, default: () => [] },
  width: { type: Number, default: 120 },
  height: { type: Number, default: 40 },
  color: { type: String, default: 'var(--brand-600)' },
  fill: { type: Boolean, default: true },
})
const uid = Math.random().toString(36).slice(2, 8)
const geo = computed(() => {
  const d = props.data
  if (!d.length) return { line: '', area: '', end: null }
  const max = Math.max(...d), min = Math.min(...d)
  const range = max - min || 1
  const pad = 3
  const w = props.width, h = props.height
  const pts = d.map((v, i) => {
    const x = pad + (i / (d.length - 1)) * (w - pad * 2)
    const y = pad + (1 - (v - min) / range) * (h - pad * 2)
    return [x, y]
  })
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = line + ` L${pts.at(-1)[0].toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z`
  return { line, area, end: pts.at(-1) }
})
</script>

<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" class="overflow-visible">
    <defs>
      <linearGradient :id="'sg' + uid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.22" />
        <stop offset="100%" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path v-if="fill" :d="geo.area" :fill="'url(#sg' + uid + ')'" />
    <path :d="geo.line" fill="none" :stroke="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <circle v-if="geo.end" :cx="geo.end[0]" :cy="geo.end[1]" r="3" :fill="color" />
  </svg>
</template>
