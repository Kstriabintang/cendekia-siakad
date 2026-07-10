<script setup>
import { computed } from 'vue'
const props = defineProps({
  name: { type: String, default: '?' },
  src: { type: String, default: null },
  size: { type: Number, default: 40 },
})
const initials = computed(() =>
  props.name.split(' ').slice(0, 2).map((s) => s[0] || '').join('').toUpperCase()
)
// Deterministic hue from name
const hue = computed(() => {
  let h = 0
  for (const ch of props.name) h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
})
const style = computed(() => ({
  width: props.size + 'px', height: props.size + 'px',
  fontSize: Math.round(props.size * 0.38) + 'px',
  background: `linear-gradient(135deg, hsl(${hue.value} 55% 55%), hsl(${(hue.value + 40) % 360} 60% 45%))`,
}))
</script>

<template>
  <div class="relative inline-grid place-items-center rounded-full font-bold text-white shrink-0 shadow-sm"
       :style="style" :title="name">
    <img v-if="src" :src="src" :alt="name" class="absolute inset-0 h-full w-full rounded-full object-cover" />
    <span v-else>{{ initials }}</span>
  </div>
</template>
