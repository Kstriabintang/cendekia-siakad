<script setup>
defineProps({ title: String, subtitle: String, eyebrow: { type: String, default: null } })
</script>

<template>
  <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
    <div>
      <p v-if="eyebrow" class="label-eyebrow mb-1.5">{{ eyebrow }}</p>
      <h1 class="text-2xl sm:text-[1.7rem] font-bold tracking-tight text-balance" style="font-family: var(--font-serif)">{{ title }}</h1>
      <p v-if="subtitle" class="text-muted mt-1 text-[0.95rem]">{{ subtitle }}</p>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  </header>
</template>
