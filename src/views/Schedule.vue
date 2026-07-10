<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from '@/services/api.js'
import { useAuth } from '@/stores/auth.js'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import Chip from '@/components/Chip.vue'
import * as icons from 'lucide-vue-next'

const auth = useAuth()
const schedule = ref([])
const loading = ref(true)
const view = ref('grid') // grid | list

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
const todayName = HARI[new Date().getDay()]

onMounted(async () => {
  schedule.value = await api.getSchedule({ userId: auth.user.id, role: auth.role })
  loading.value = false
})

// ── Copy per-role ────────────────────────────────────────────────────────
const isDosen = computed(() => auth.role === 'dosen')
const isAdmin = computed(() => auth.role === 'admin')
const pageTitle = computed(() => (isDosen.value ? 'Jadwal Mengajar' : 'Jadwal Kuliah'))
const pageSubtitle = computed(() =>
  isDosen.value
    ? 'Kelas yang Anda ampu · Tahun Akademik 2025/2026 Ganjil'
    : isAdmin.value
      ? 'Seluruh kelas yang berjalan semester ini · 2025/2026 Ganjil'
      : 'Rencana studi yang telah disetujui · 2025/2026 Ganjil')

// ── Grouping & stats ─────────────────────────────────────────────────────
const sorted = computed(() =>
  [...schedule.value].sort((a, b) => a.jamMulai.localeCompare(b.jamMulai) || a.kelas.localeCompare(b.kelas)),
)
const byDay = computed(() => {
  const map = Object.fromEntries(DAYS.map((d) => [d, []]))
  for (const c of sorted.value) if (map[c.hari]) map[c.hari].push(c)
  return map
})
const listDays = computed(() => DAYS.filter((d) => byDay.value[d].length))

const totalSks = computed(() => schedule.value.reduce((s, c) => s + (c.sks || 0), 0))
const jumlahMk = computed(() => schedule.value.length)
const jumlahHari = computed(() => listDays.value.length)

// ── Color accents per mata kuliah (subtle brand-forward palette) ────────
const PALETTE = ['brand', 'info', 'success', 'gold', 'warning', 'danger']
const SOFT = {
  brand: 'var(--brand-50)', info: 'var(--info-soft)', success: 'var(--success-soft)',
  gold: 'var(--gold-soft)', warning: 'var(--warning-soft)', danger: 'var(--danger-soft)',
}
const STRONG = {
  brand: 'var(--brand-600)', info: 'var(--info)', success: 'var(--success)',
  gold: 'var(--gold)', warning: 'var(--warning)', danger: 'var(--danger)',
}
function toneFor(kode) {
  let h = 0
  for (let i = 0; i < (kode || '').length; i++) h = (h * 31 + kode.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}
const blockStyle = (c) => {
  const t = toneFor(c.mk?.kode)
  return { background: SOFT[t], borderColor: 'color-mix(in oklab, ' + STRONG[t] + ' 40%, transparent)' }
}
const accentStyle = (c) => ({ background: STRONG[toneFor(c.mk?.kode)] })
const accentText = (c) => ({ color: STRONG[toneFor(c.mk?.kode)] })
</script>

<template>
  <div>
    <PageHeader eyebrow="Akademik" :title="pageTitle" :subtitle="pageSubtitle">
      <template #actions>
        <div v-if="!loading && schedule.length" class="hidden lg:inline-flex items-center gap-1 rounded-xl border border-border p-1 bg-surface-2">
          <button v-for="opt in [{ v: 'grid', icon: 'LayoutGrid', label: 'Grid' }, { v: 'list', icon: 'List', label: 'Daftar' }]"
            :key="opt.v" @click="view = opt.v"
            class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            :class="view === opt.v ? 'bg-card text-brand-700 dark:text-brand-600 shadow-sm' : 'text-muted hover:text-ink'">
            <component :is="icons[opt.icon]" :size="16" /> {{ opt.label }}
          </button>
        </div>
      </template>
    </PageHeader>

    <div v-if="loading" class="text-muted flex items-center gap-2 py-10 justify-center">
      <icons.Loader2 class="animate-spin" :size="18" /> Memuat…
    </div>

    <template v-else>
      <!-- Empty state -->
      <section v-if="!schedule.length" class="card p-10 text-center">
        <div class="grid place-items-center mx-auto mb-4 h-16 w-16 rounded-2xl" style="background: var(--brand-50); color: var(--brand-600)">
          <icons.CalendarOff :size="30" />
        </div>
        <h3 class="text-lg font-semibold mb-1" style="font-family: var(--font-serif)">Belum ada jadwal</h3>
        <p class="text-muted max-w-md mx-auto mb-5 text-[0.95rem]">
          <template v-if="auth.role === 'mahasiswa'">
            Jadwal kuliah muncul setelah KRS Anda disetujui Dosen Wali. Susun dan ajukan rencana studi Anda terlebih dahulu.
          </template>
          <template v-else>Belum ada kelas yang tercatat untuk tahun akademik aktif.</template>
        </p>
        <RouterLink v-if="auth.role === 'mahasiswa'" to="/krs" class="btn btn-primary">
          <icons.ClipboardCheck :size="17" /> Buka Rencana Studi
        </RouterLink>
      </section>

      <template v-else>
        <!-- Header stats -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Total SKS" :value="totalSks" suffix="SKS" icon="Layers" tone="brand" />
          <StatCard :label="isDosen ? 'Kelas Diampu' : 'Mata Kuliah'" :value="jumlahMk" icon="BookMarked" tone="info" />
          <StatCard label="Hari Kuliah" :value="jumlahHari" suffix="/ 5" icon="CalendarRange" tone="gold" />
        </div>

        <!-- Weekly timetable grid (lg and up) -->
        <section class="card p-0 overflow-hidden" :class="view === 'grid' ? 'hidden lg:block' : 'hidden'">
          <div class="grid grid-cols-5 sticky top-0 z-10 bg-card border-b border-border-strong">
            <div v-for="day in DAYS" :key="day"
              class="px-3 py-3 text-center border-r border-border last:border-r-0"
              :style="day === todayName ? { background: 'var(--brand-50)' } : {}">
              <div class="font-semibold" :class="day === todayName && 'text-brand-700 dark:text-brand-600'">{{ day }}</div>
              <div class="text-[0.7rem] text-faint num">{{ byDay[day].length }} kelas</div>
            </div>
          </div>
          <div class="grid grid-cols-5">
            <div v-for="day in DAYS" :key="day"
              class="border-r border-border last:border-r-0 p-2 flex flex-col gap-2 min-h-[22rem]"
              :style="day === todayName ? { background: 'color-mix(in oklab, var(--brand-50) 55%, transparent)' } : {}">
              <article v-for="c in byDay[day]" :key="c.id"
                class="relative rounded-xl border p-3 pl-3.5 overflow-hidden" :style="blockStyle(c)">
                <span class="absolute left-0 top-0 h-full w-1" :style="accentStyle(c)"></span>
                <div class="flex items-center gap-1.5 text-[0.72rem] font-semibold num" :style="accentText(c)">
                  <icons.Clock :size="12" /> {{ c.jamMulai }}–{{ c.jamSelesai }}
                </div>
                <h4 class="mt-1.5 font-semibold text-[0.9rem] leading-snug text-ink">{{ c.mk.nama }}</h4>
                <div class="mt-0.5 text-[0.72rem] text-muted num">{{ c.mk.kode }} · Kelas {{ c.kelas }} · {{ c.sks }} SKS</div>
                <div class="mt-2 flex flex-col gap-1 text-[0.72rem] text-muted">
                  <span class="flex items-center gap-1.5 truncate"><icons.MapPin :size="12" class="shrink-0" /> {{ c.ruang }}</span>
                  <span class="flex items-center gap-1.5 truncate">
                    <component :is="isDosen ? icons.Users : icons.User" :size="12" class="shrink-0" />
                    <template v-if="isDosen"><span class="num">{{ c.terisi }}</span> mahasiswa</template>
                    <template v-else>{{ c.dosen?.name }}</template>
                  </span>
                </div>
              </article>
              <div v-if="!byDay[day].length" class="flex-1 grid place-items-center text-faint text-[0.72rem] py-6">
                <span class="flex flex-col items-center gap-1"><icons.Minus :size="16" class="opacity-50" /> Kosong</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Grouped list (list view, and automatic mobile fallback) -->
        <div class="flex flex-col gap-5" :class="view === 'list' ? 'block' : 'lg:hidden'">
          <section v-for="day in listDays" :key="day" class="card p-0 overflow-hidden">
            <header class="flex items-center justify-between px-5 py-3 border-b border-border"
              :style="day === todayName ? { background: 'var(--brand-50)' } : {}">
              <h3 class="font-semibold flex items-center gap-2">
                <icons.CalendarDays :size="17" :class="day === todayName ? 'text-brand-600' : 'text-faint'" />
                {{ day }}
                <Chip v-if="day === todayName" tone="brand" dot>Hari ini</Chip>
              </h3>
              <span class="text-[0.75rem] text-faint num">{{ byDay[day].length }} kelas</span>
            </header>
            <div class="divide-y divide-border">
              <div v-for="c in byDay[day]" :key="c.id" class="flex items-center gap-3 px-4 py-3">
                <div class="text-center shrink-0 w-16">
                  <div class="num text-sm font-bold" :style="accentText(c)">{{ c.jamMulai }}</div>
                  <div class="text-[0.68rem] text-faint num">{{ c.jamSelesai }}</div>
                </div>
                <div class="h-11 w-1 rounded-full shrink-0" :style="accentStyle(c)"></div>
                <div class="min-w-0 flex-1">
                  <div class="font-medium truncate">{{ c.mk.nama }}</div>
                  <div class="text-[0.75rem] text-faint truncate num">
                    {{ c.mk.kode }} · Kelas {{ c.kelas }} · {{ c.sks }} SKS ·
                    <template v-if="isDosen">{{ c.terisi }} mahasiswa</template>
                    <template v-else>{{ c.dosen?.name }}</template>
                  </div>
                </div>
                <Chip tone="info" dot><icons.MapPin :size="12" /> {{ c.ruang }}</Chip>
              </div>
            </div>
          </section>
        </div>
      </template>
    </template>
  </div>
</template>
