<script setup>
import { computed } from 'vue'
const props = defineProps({
  data: { type: Array, default: () => [] }, // [{label, value}]
  color: { type: String, default: 'var(--brand-600)' },
  height: { type: Number, default: 160 },
})
const max = computed(() => Math.max(1, ...props.data.map((d) => d.value)))
</script>

<template>
  <div class="flex items-end gap-2" :style="{ height: height + 'px' }">
    <div v-for="(d, i) in data" :key="i" class="group flex-1 flex flex-col items-center justify-end gap-2 h-full">
      <div class="relative w-full flex items-end justify-center h-full">
        <div class="w-full max-w-[38px] rounded-t-lg transition-all duration-500"
             :style="{ height: (d.value / max * 100) + '%', background: d.highlight ? color : 'color-mix(in oklab, ' + color + ' 30%, transparent)' }">
          <span class="num absolute -top-5 left-1/2 -translate-x-1/2 text-[0.7rem] font-semibold text-muted opacity-0 group-hover:opacity-100 transition">{{ d.value }}</span>
        </div>
      </div>
      <span class="text-[0.68rem] text-faint font-medium">{{ d.label }}</span>
    </div>
  </div>
</template>
