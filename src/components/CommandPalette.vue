<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api.js'
import { useAuth } from '@/stores/auth.js'
import { sound } from '@/lib/sound.js'
import * as icons from 'lucide-vue-next'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['update:open'])
const router = useRouter()
const auth = useAuth()

const query = ref('')
const active = ref(0)
const inputEl = ref(null)
const mahasiswa = ref([])
const mataKuliah = ref([])
const loaded = ref(false)

const PAGES = [
  { label: 'Dashboard', to: '/dashboard', icon: 'LayoutDashboard', roles: null, kw: 'beranda home' },
  { label: 'Rencana Studi (KRS)', to: '/krs', icon: 'ClipboardCheck', roles: ['mahasiswa'], kw: 'krs kartu rencana studi' },
  { label: 'Perwalian', to: '/perwalian', icon: 'UserCheck', roles: ['mahasiswa', 'dosen'], kw: 'wali validasi' },
  { label: 'Jadwal Kuliah', to: '/schedule', icon: 'CalendarDays', roles: ['mahasiswa', 'dosen', 'admin'], kw: 'jadwal mengajar timetable' },
  { label: 'Kurikulum & Mata Kuliah', to: '/curriculum', icon: 'Library', roles: null, kw: 'kurikulum mk sks prasyarat' },
  { label: 'Nilai & KHS', to: '/grades', icon: 'GraduationCap', roles: ['mahasiswa', 'dosen'], kw: 'nilai khs ips input' },
  { label: 'Transkrip Akademik', to: '/transcript', icon: 'ScrollText', roles: ['mahasiswa'], kw: 'transkrip ipk cetak' },
  { label: 'Presensi', to: '/attendance', icon: 'CalendarCheck2', roles: ['mahasiswa', 'dosen'], kw: 'presensi kehadiran absen' },
  { label: 'Keuangan (UKT)', to: '/payments', icon: 'Wallet', roles: ['mahasiswa', 'admin'], kw: 'ukt bayar tagihan spp virtual account' },
  { label: 'Kalender Akademik', to: '/calendar', icon: 'CalendarRange', roles: null, kw: 'kalender agenda' },
  { label: 'Pengumuman', to: '/announcements', icon: 'Megaphone', roles: null, kw: 'pengumuman info' },
  { label: 'Manajemen Data', to: '/management', icon: 'DatabaseZap', roles: ['admin'], kw: 'kelola data admin' },
  { label: 'Biodata & Profil', to: '/profile', icon: 'User', roles: null, kw: 'profil biodata akun' },
]

const visiblePages = computed(() => PAGES.filter((p) => !p.roles || p.roles.includes(auth.role)))
const q = computed(() => query.value.trim().toLowerCase())

const pageResults = computed(() => {
  if (!q.value) return visiblePages.value.slice(0, 6)
  return visiblePages.value.filter((p) => (p.label + ' ' + p.kw).toLowerCase().includes(q.value))
})
const mkResults = computed(() => {
  if (!q.value) return []
  return mataKuliah.value.filter((m) => (m.nama + ' ' + m.kode).toLowerCase().includes(q.value)).slice(0, 6)
})
const mhsResults = computed(() => {
  if (!q.value || auth.role === 'mahasiswa') return []
  return mahasiswa.value.filter((m) => (m.name + ' ' + m.nim).toLowerCase().includes(q.value)).slice(0, 6)
})

// Flat list for keyboard navigation
const flat = computed(() => [
  ...pageResults.value.map((p) => ({ type: 'page', ...p })),
  ...mkResults.value.map((m) => ({ type: 'mk', label: m.nama, sub: `${m.kode} · ${m.sks} SKS · Semester ${m.semester}`, to: '/curriculum', icon: 'BookMarked' })),
  ...mhsResults.value.map((m) => ({ type: 'mhs', label: m.name, sub: `${m.nim} · ${m.prodiNama || 'Mahasiswa'}`, to: auth.role === 'admin' ? '/management' : '/perwalian', icon: 'UserRound' })),
])

const groupLabel = { page: 'Halaman', mk: 'Mata Kuliah', mhs: 'Mahasiswa' }
const groupStart = computed(() => {
  const map = {}
  flat.value.forEach((item, i) => { if (map[item.type] === undefined) map[item.type] = i })
  return map
})

watch(q, () => { active.value = 0 })

function go(item) {
  if (!item) return
  sound.play('click')
  emit('update:open', false)
  router.push(item.to)
}
function move(d) {
  const n = flat.value.length
  if (!n) return
  active.value = (active.value + d + n) % n
}
function onKey(e) {
  if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); emit('update:open', !props.open); return }
  if (!props.open) return
  if (e.key === 'Escape') emit('update:open', false)
  else if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
  else if (e.key === 'Enter') { e.preventDefault(); go(flat.value[active.value]) }
}

watch(() => props.open, async (v) => {
  if (v) {
    query.value = ''; active.value = 0
    if (!loaded.value) {
      loaded.value = true
      mataKuliah.value = await api.listMataKuliah({})
      if (auth.role !== 'mahasiswa') mahasiswa.value = await api.listUsers('mahasiswa')
    }
    await nextTick(); inputEl.value?.focus()
  }
})

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <transition name="fade">
    <div v-if="open" class="fixed inset-0 z-[60] flex items-start justify-center p-4 sm:pt-24" @click.self="emit('update:open', false)">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div class="relative w-full max-w-xl card p-0 overflow-hidden shadow-2xl">
        <!-- Search field -->
        <div class="flex items-center gap-2.5 px-4 border-b border-border">
          <icons.Search :size="18" class="text-faint shrink-0" />
          <input ref="inputEl" v-model="query" type="text" placeholder="Cari halaman, mata kuliah, mahasiswa…"
            class="flex-1 bg-transparent outline-none py-4 text-[0.95rem] text-ink placeholder:text-faint" />
          <kbd class="text-[0.62rem] font-mono text-faint border border-border rounded px-1.5 py-0.5 shrink-0">ESC</kbd>
        </div>

        <!-- Results -->
        <div class="max-h-[60vh] overflow-y-auto p-2">
          <template v-if="flat.length">
            <template v-for="(item, i) in flat" :key="item.type + i">
              <p v-if="i === groupStart[item.type]" class="label-eyebrow px-2 pb-1" :class="i === 0 ? 'pt-2' : 'pt-3'">{{ groupLabel[item.type] }}</p>
              <button
                class="w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors"
                :class="active === i ? 'text-ink' : 'text-muted hover:bg-surface-2'"
                :style="active === i ? 'background: var(--brand-50)' : ''"
                @mouseenter="active = i" @click="go(item)">
                <span class="grid h-8 w-8 place-items-center rounded-lg shrink-0" style="background: var(--surface-2)"><component :is="icons[item.icon] || icons.Circle" :size="16" /></span>
                <span class="min-w-0 flex-1">
                  <span class="block text-[0.9rem] font-medium truncate">{{ item.label }}</span>
                  <span v-if="item.sub" class="block text-[0.72rem] text-faint truncate num">{{ item.sub }}</span>
                </span>
                <icons.CornerDownLeft v-if="active === i" :size="14" class="text-faint shrink-0" />
              </button>
            </template>
          </template>
          <div v-else class="text-center py-10 text-faint">
            <icons.SearchX :size="28" class="mx-auto mb-2 opacity-60" />
            <p class="text-sm">Tidak ada hasil untuk "{{ query }}"</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center gap-4 px-4 py-2.5 border-t border-border text-[0.7rem] text-faint no-print">
          <span class="flex items-center gap-1"><kbd class="font-mono border border-border rounded px-1">↑</kbd><kbd class="font-mono border border-border rounded px-1">↓</kbd> navigasi</span>
          <span class="flex items-center gap-1"><kbd class="font-mono border border-border rounded px-1">↵</kbd> buka</span>
          <span class="ml-auto flex items-center gap-1"><kbd class="font-mono border border-border rounded px-1">⌘</kbd><kbd class="font-mono border border-border rounded px-1">K</kbd></span>
        </div>
      </div>
    </div>
  </transition>
</template>
