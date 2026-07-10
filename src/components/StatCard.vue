<script setup>
import { computed } from 'vue'
import Sparkline from './Sparkline.vue'
import * as icons from 'lucide-vue-next'

const props = defineProps({
  label: String,
  value: [String, Number],
  suffix: { type: String, default: '' },
  icon: { type: String, default: 'Activity' },
  tone: { type: String, default: 'brand' }, // brand|success|warning|info|gold
  delta: { type: String, default: null },
  deltaUp: { type: Boolean, default: true },
  spark: { type: Array, default: null },
  to: { type: String, default: null },
})
const IconCmp = computed(() => icons[props.icon] || icons.Activity)
const toneColor = {
  brand: 'var(--brand-600)', success: 'var(--success)', warning: 'var(--warning)',
  info: 'var(--info)', gold: 'var(--gold)', danger: 'var(--danger)',
}
const toneSoft = {
  brand: 'var(--brand-50)', success: 'var(--success-soft)', warning: 'var(--warning-soft)',
  info: 'var(--info-soft)', gold: 'var(--gold-soft)', danger: 'var(--danger-soft)',
}
</script>

<template>
  <component :is="to ? 'RouterLink' : 'div'" :to="to"
    class="card card-hover p-5 flex flex-col gap-3" :class="to && 'group'">
    <div class="flex items-start justify-between gap-3">
      <div class="grid h-11 w-11 place-items-center rounded-xl" :style="{ background: toneSoft[tone], color: toneColor[tone] }">
        <component :is="IconCmp" :size="21" :stroke-width="2" />
      </div>
      <Sparkline v-if="spark" :data="spark" :color="toneColor[tone]" :width="86" :height="34" />
    </div>
    <div>
      <div class="flex items-baseline gap-1.5">
        <span class="num text-[1.75rem] font-bold leading-none tracking-tight" style="font-family: var(--font-serif)">{{ value }}</span>
        <span v-if="suffix" class="text-sm text-muted font-medium">{{ suffix }}</span>
      </div>
      <div class="mt-1.5 flex items-center gap-2">
        <span class="text-[0.82rem] text-muted">{{ label }}</span>
        <span v-if="delta" class="chip" :class="deltaUp ? 'text-success' : 'text-danger'"
              :style="deltaUp ? 'background:var(--success-soft)' : 'background:var(--danger-soft)'">
          {{ deltaUp ? '↑' : '↓' }} {{ delta }}
        </span>
        <icons.ArrowRight v-if="to" :size="14"
          class="ml-auto text-faint opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </div>
    </div>
  </component>
</template>
