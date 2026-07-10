<script setup>
import { ref, computed, onMounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import Chip from '@/components/Chip.vue'
import { api } from '@/services/api.js'
import { sound } from '@/lib/sound.js'
import { icons } from '@/lib/icons'

const loading = ref(true)
const events = ref([])

// Reference "today" for the academic term demo.
const TODAY = new Date('2025-10-15T00:00:00')
const TODAY_KEY = keyOf(TODAY)

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

const cursor = ref({ year: 2025, month: 9 }) // month 0-indexed; default Oktober 2025
const selectedKey = ref(null)

function keyOf(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
function parse(s) { return new Date(s + 'T00:00:00') }
// warna token → css var (brand has no bare --brand, use --brand-600)
function warnaVar(w) { return w === 'brand' ? 'var(--brand-600)' : `var(--${w})` }

onMounted(async () => {
  events.value = await api.listKalender()
  // Start at the month of the earliest event if it is before our default.
  if (events.value.length) {
    const first = parse(events.value.reduce((m, e) => (e.mulai < m ? e.mulai : m), events.value[0].mulai))
    cursor.value = { year: first.getFullYear(), month: first.getMonth() }
  }
  loading.value = false
})

const monthLabel = computed(() => `${MONTHS[cursor.value.month]} ${cursor.value.year}`)

// Map: day-of-month (1..N) → events covering that day in the current month.
const eventsByDay = computed(() => {
  const { year, month } = cursor.value
  const map = {}
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)
  for (const e of events.value) {
    const start = parse(e.mulai)
    const end = parse(e.selesai || e.mulai)
    // clamp to this month
    const from = start > monthStart ? start : monthStart
    const to = end < monthEnd ? end : monthEnd
    if (from > to) continue
    for (let d = from.getDate(); d <= to.getDate(); d++) {
      ;(map[d] ||= []).push(e)
    }
  }
  return map
})

// Grid cells: leading blanks (null) + day objects.
const cells = computed(() => {
  const { year, month } = cursor.value
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // Monday-first
  const out = []
  for (let i = 0; i < firstWeekday; i++) out.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const key = keyOf(new Date(year, month, d))
    out.push({ day: d, key, events: eventsByDay.value[d] || [], isToday: key === TODAY_KEY })
  }
  return out
})

const selectedEvents = computed(() => {
  if (!selectedKey.value) return []
  return events.value.filter((e) => {
    const s = e.mulai, en = e.selesai || e.mulai
    return selectedKey.value >= s && selectedKey.value <= en
  })
})

function prevMonth() {
  const c = cursor.value
  cursor.value = c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }
  selectedKey.value = null
  sound.play('tick')
}
function nextMonth() {
  const c = cursor.value
  cursor.value = c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }
  selectedKey.value = null
  sound.play('tick')
}
function selectDay(cell) {
  if (!cell || !cell.events.length) { selectedKey.value = null; return }
  selectedKey.value = selectedKey.value === cell.key ? null : cell.key
  sound.play('click')
}

// Agenda: all events sorted by start date (api already sorts asc).
const agenda = computed(() => events.value.map((e) => ({ ...e, past: (e.selesai || e.mulai) < TODAY_KEY })))

// Legend: unique kategori → warna.
const legend = computed(() => {
  const seen = new Map()
  for (const e of events.value) if (!seen.has(e.kategori)) seen.set(e.kategori, e.warna)
  return [...seen.entries()].map(([kategori, warna]) => ({ kategori, warna }))
})

function fmtRange(mulai, selesai) {
  const d1 = parse(mulai), d2 = parse(selesai || mulai)
  const day1 = d1.getDate(), day2 = d2.getDate()
  const sameYear = d1.getFullYear() === d2.getFullYear()
  const sameMonth = sameYear && d1.getMonth() === d2.getMonth()
  if (mulai === (selesai || mulai)) return `${day1} ${MONTHS[d1.getMonth()]} ${d1.getFullYear()}`
  if (sameMonth) return `${day1} – ${day2} ${MONTHS[d2.getMonth()]} ${d2.getFullYear()}`
  if (sameYear) return `${day1} ${MONTHS_SHORT[d1.getMonth()]} – ${day2} ${MONTHS_SHORT[d2.getMonth()]} ${d2.getFullYear()}`
  return `${day1} ${MONTHS_SHORT[d1.getMonth()]} ${d1.getFullYear()} – ${day2} ${MONTHS_SHORT[d2.getMonth()]} ${d2.getFullYear()}`
}
function fmtDayLong(key) {
  const d = parse(key)
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  return `${HARI[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Tahun Akademik 2025/2026 Ganjil"
      title="Kalender Akademik"
      subtitle="Jadwal registrasi, perkuliahan, ujian, dan agenda penting semester ini">
      <template #actions>
        <RouterLink to="/announcements" class="btn btn-outline"><icons.Megaphone :size="17" /> Pengumuman</RouterLink>
      </template>
    </PageHeader>

    <div v-if="loading" class="text-muted flex items-center gap-2 py-10 justify-center">
      <icons.Loader2 class="animate-spin" :size="18" /> Memuat…
    </div>

    <template v-else>
      <!-- Legend -->
      <div class="flex flex-wrap items-center gap-2 mb-5">
        <span class="text-sm text-muted mr-1">Kategori:</span>
        <span v-for="l in legend" :key="l.kategori"
          class="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[0.78rem] font-medium">
          <span class="h-2 w-2 rounded-full" :style="{ background: warnaVar(l.warna) }"></span>{{ l.kategori }}
        </span>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Calendar -->
        <section class="lg:col-span-2 card p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold flex items-center gap-2" style="font-family: var(--font-serif)">
              <icons.CalendarRange :size="19" class="text-brand-600" /> {{ monthLabel }}
            </h3>
            <div class="flex items-center gap-1.5">
              <button class="btn btn-outline !px-2.5 !py-2" title="Bulan sebelumnya" @click="prevMonth"><icons.ChevronLeft :size="17" /></button>
              <button class="btn btn-outline !px-2.5 !py-2" title="Bulan berikutnya" @click="nextMonth"><icons.ChevronRight :size="17" /></button>
            </div>
          </div>

          <!-- weekday header -->
          <div class="grid grid-cols-7 gap-1.5 mb-1.5">
            <div v-for="w in WEEKDAYS" :key="w" class="text-center text-[0.72rem] font-semibold text-faint uppercase tracking-wide py-1">{{ w }}</div>
          </div>

          <!-- day grid -->
          <div class="grid grid-cols-7 gap-1.5">
            <template v-for="(cell, i) in cells" :key="i">
              <div v-if="!cell" class="aspect-square"></div>
              <button v-else type="button" @click="selectDay(cell)"
                class="aspect-square rounded-xl border p-1 sm:p-1.5 flex flex-col text-left transition-colors"
                :class="[
                  cell.events.length ? 'cursor-pointer hover:bg-surface-2' : 'cursor-default',
                  selectedKey === cell.key ? 'border-brand-400' : 'border-border',
                  cell.isToday ? 'ring-2 ring-brand-400/50' : '',
                ]"
                :style="selectedKey === cell.key ? { background: 'var(--brand-50)' } : {}">
                <span class="num text-xs sm:text-sm font-medium"
                  :class="cell.isToday ? 'text-brand-700 dark:text-brand-600 font-bold' : cell.events.length ? 'text-ink' : 'text-faint'">
                  {{ cell.day }}
                </span>
                <div class="mt-auto flex flex-wrap gap-0.5 items-end">
                  <span v-for="(ev, j) in cell.events.slice(0, 3)" :key="j"
                    class="h-1.5 rounded-full" :style="{ background: warnaVar(ev.warna), width: cell.events.length > 1 ? '0.375rem' : '100%' }"></span>
                  <span v-if="cell.events.length > 3" class="text-[0.6rem] text-faint leading-none">+{{ cell.events.length - 3 }}</span>
                </div>
              </button>
            </template>
          </div>

          <!-- selected day detail -->
          <div v-if="selectedKey" class="mt-5 rounded-xl border border-border p-4">
            <div class="flex items-center gap-2 mb-3">
              <icons.CalendarDays :size="16" class="text-brand-600" />
              <span class="text-sm font-semibold">{{ fmtDayLong(selectedKey) }}</span>
            </div>
            <div v-if="selectedEvents.length" class="flex flex-col gap-2">
              <div v-for="e in selectedEvents" :key="e.id" class="flex items-center gap-3">
                <span class="h-8 w-1 rounded-full shrink-0" :style="{ background: warnaVar(e.warna) }"></span>
                <div class="min-w-0">
                  <div class="text-sm font-medium truncate">{{ e.judul }}</div>
                  <div class="text-[0.72rem] text-faint">{{ e.kategori }} · {{ fmtRange(e.mulai, e.selesai) }}</div>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-faint">Tidak ada agenda pada tanggal ini.</p>
          </div>
          <p v-else class="mt-4 text-[0.78rem] text-faint flex items-center gap-1.5">
            <icons.MousePointerClick :size="13" /> Klik tanggal bertanda untuk melihat agendanya.
          </p>
        </section>

        <!-- Agenda list -->
        <section class="card p-5">
          <h3 class="font-semibold mb-4 flex items-center gap-2"><icons.ListTodo :size="18" class="text-brand-600" /> Agenda Semester</h3>
          <div v-if="agenda.length" class="flex flex-col gap-2.5">
            <div v-for="e in agenda" :key="e.id"
              class="rounded-xl border border-border p-3 pl-3.5 border-l-[3px] transition-opacity"
              :class="e.past ? 'opacity-55' : ''"
              :style="{ borderLeftColor: warnaVar(e.warna) }">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.68rem] font-medium"
                  :style="{ background: warnaVar(e.warna), color: '#fff' }">{{ e.kategori }}</span>
                <span v-if="e.past" class="text-[0.65rem] text-faint uppercase tracking-wide">Selesai</span>
                <span v-else-if="e.mulai <= TODAY_KEY && (e.selesai || e.mulai) >= TODAY_KEY" class="text-[0.65rem] text-success font-semibold uppercase tracking-wide">Berlangsung</span>
              </div>
              <div class="text-sm font-medium leading-snug">{{ e.judul }}</div>
              <div class="text-[0.72rem] text-muted mt-0.5 flex items-center gap-1"><icons.CalendarClock :size="12" /> {{ fmtRange(e.mulai, e.selesai) }}</div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-faint">
            <icons.CalendarOff :size="30" class="mx-auto mb-2 opacity-60" />
            <p class="text-sm">Belum ada agenda akademik.</p>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
