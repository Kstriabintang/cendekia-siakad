<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { sound } from '@/lib/sound.js'
import { icons } from '@/lib/icons'

const deferred = ref(null)      // beforeinstallprompt event (Android/desktop Chrome/Edge)
const canInstall = ref(false)   // native prompt available
const isIOS = ref(false)
const standalone = ref(false)
const dismissed = ref(localStorage.getItem('siakad-pwa-dismissed') === '1')
const iosSheet = ref(false)

function onBIP(e) { e.preventDefault(); deferred.value = e; canInstall.value = true }
function onInstalled() { canInstall.value = false; deferred.value = null; standalone.value = true }

onMounted(() => {
  const ua = window.navigator.userAgent || ''
  isIOS.value = /iphone|ipad|ipod/i.test(ua) && !window.MSStream
  standalone.value = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  window.addEventListener('beforeinstallprompt', onBIP)
  window.addEventListener('appinstalled', onInstalled)
})
onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBIP)
  window.removeEventListener('appinstalled', onInstalled)
})

// Show the banner when: not already installed, not dismissed, and either a native
// prompt is available (Android/desktop) or we're on iOS Safari (manual add).
const show = computed(() => !standalone.value && !dismissed.value && (canInstall.value || isIOS.value))

async function install() {
  if (deferred.value) {
    sound.play('click')
    deferred.value.prompt()
    await deferred.value.userChoice
    deferred.value = null; canInstall.value = false
  } else if (isIOS.value) {
    iosSheet.value = true
  }
}
function dismiss() { dismissed.value = true; localStorage.setItem('siakad-pwa-dismissed', '1') }
</script>

<template>
  <!-- Slim install banner -->
  <transition name="fade">
    <div v-if="show" class="fixed z-50 left-3 right-3 bottom-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm safe-bottom no-print">
      <div class="card p-3.5 flex items-center gap-3 shadow-xl">
        <span class="grid h-11 w-11 place-items-center rounded-xl shrink-0" style="background: var(--brand-600)">
          <svg viewBox="0 0 32 32" class="h-6 w-6"><path d="M16 6 L27 11 L16 16 L5 11 Z" fill="white"/><path d="M9 14 L9 20 Q16 24 23 20 L23 14" fill="none" stroke="white" stroke-width="1.8"/></svg>
        </span>
        <div class="min-w-0 flex-1">
          <div class="text-[0.86rem] font-semibold leading-tight">Instal Cendekia SIAKAD</div>
          <div class="text-[0.74rem] text-faint">Akses cepat dari layar utama, bisa offline.</div>
        </div>
        <button class="btn btn-primary px-3 py-2 shrink-0" @click="install">
          <icons.Download :size="15" /> Instal
        </button>
        <button class="btn btn-ghost px-1.5 shrink-0" title="Tutup" @click="dismiss"><icons.X :size="16" /></button>
      </div>
    </div>
  </transition>

  <!-- iOS instructions sheet (Safari has no programmatic install) -->
  <transition name="fade">
    <div v-if="iosSheet" class="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 no-print" @click.self="iosSheet = false">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div class="relative card p-5 w-full sm:max-w-sm safe-bottom">
        <div class="flex items-center gap-2.5 mb-4">
          <icons.Share :size="20" class="text-brand-600" />
          <h3 class="font-semibold">Pasang di iPhone / iPad</h3>
          <button class="btn btn-ghost px-1.5 ml-auto" @click="iosSheet = false"><icons.X :size="16" /></button>
        </div>
        <ol class="flex flex-col gap-3 text-sm text-muted">
          <li class="flex gap-3"><span class="grid h-6 w-6 place-items-center rounded-full text-[0.72rem] font-bold shrink-0" style="background: var(--brand-50); color: var(--brand-600)">1</span> Ketuk tombol <b class="text-ink">Bagikan</b> <icons.Share :size="14" class="inline align-middle" /> di bar Safari.</li>
          <li class="flex gap-3"><span class="grid h-6 w-6 place-items-center rounded-full text-[0.72rem] font-bold shrink-0" style="background: var(--brand-50); color: var(--brand-600)">2</span> Pilih <b class="text-ink">Tambah ke Layar Utama</b> <icons.SquarePlus :size="14" class="inline align-middle" />.</li>
          <li class="flex gap-3"><span class="grid h-6 w-6 place-items-center rounded-full text-[0.72rem] font-bold shrink-0" style="background: var(--brand-50); color: var(--brand-600)">3</span> Ketuk <b class="text-ink">Tambah</b> — ikon SIAKAD muncul di layar utama.</li>
        </ol>
        <button class="btn btn-outline w-full mt-5" @click="iosSheet = false">Mengerti</button>
      </div>
    </div>
  </transition>
</template>
