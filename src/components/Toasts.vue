<script setup>
import { toasts, dismiss } from '@/lib/toast.js'
import * as icons from 'lucide-vue-next'

const cfg = {
  success: { icon: 'CheckCircle2', color: 'var(--success)', bg: 'var(--success-soft)' },
  error: { icon: 'AlertCircle', color: 'var(--danger)', bg: 'var(--danger-soft)' },
  info: { icon: 'Info', color: 'var(--brand-600)', bg: 'var(--brand-50)' },
}
const Icon = (n) => icons[n] || icons.Info
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 w-[min(92vw,360px)]">
      <transition-group name="toast">
        <div v-for="t in toasts" :key="t.id"
          class="card p-3.5 flex items-start gap-3 shadow-lg cursor-pointer" @click="dismiss(t.id)">
          <span class="grid h-9 w-9 place-items-center rounded-lg shrink-0"
            :style="{ background: (cfg[t.type] || cfg.info).bg, color: (cfg[t.type] || cfg.info).color }">
            <component :is="Icon((cfg[t.type] || cfg.info).icon)" :size="18" />
          </span>
          <div class="min-w-0 flex-1">
            <div v-if="t.title" class="text-[0.85rem] font-semibold">{{ t.title }}</div>
            <div class="text-[0.82rem] text-muted">{{ t.message }}</div>
          </div>
          <icons.X :size="15" class="text-faint shrink-0 mt-0.5" />
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all .28s cubic-bezier(.4,0,.2,1); }
.toast-enter-from { opacity: 0; transform: translateX(40px) scale(.96); }
.toast-leave-to { opacity: 0; transform: translateX(40px) scale(.96); }
.toast-move { transition: transform .28s ease; }
</style>
