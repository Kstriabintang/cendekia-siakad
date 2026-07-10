<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { api } from '@/services/api.js'
import { useAuth } from '@/stores/auth.js'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import Donut from '@/components/Donut.vue'
import Chip from '@/components/Chip.vue'
import * as icons from 'lucide-vue-next'

const auth = useAuth()
const loading = ref(true)

// ── Mahasiswa ────────────────────────────────────────────────────────────
const rekap = ref([])
const expandedId = ref(null)
const toggle = (id) => { expandedId.value = expandedId.value === id ? null : id }

const avgKehadiran = computed(() =>
  rekap.value.length ? Math.round(rekap.value.reduce((a, r) => a + r.persen, 0) / rekap.value.length) : 0
)
const aman = computed(() => rekap.value.filter((r) => r.persen >= 75).length)
const berisiko = computed(() => rekap.value.filter((r) => r.persen < 75).length)

// ── Dosen ────────────────────────────────────────────────────────────────
const kelasList = ref([])
const selectedKelasId = ref(null)
const detail = ref(null)
const detailLoading = ref(false)

const kelasAvg = computed(() => {
  const r = detail.value?.roster || []
  return r.length ? Math.round(r.reduce((a, x) => a + x.persen, 0) / r.length) : 0
})
const terlaksanaCount = computed(() => (detail.value?.pertemuan || []).filter((p) => p.terlaksana).length)

watch(selectedKelasId, async (id) => {
  if (!id) return
  detailLoading.value = true
  detail.value = await api.getKelasPresensi(id)
  detailLoading.value = false
})

onMounted(async () => {
  if (auth.role === 'mahasiswa') {
    rekap.value = await api.getPresensiRekap(auth.user.id)
  } else if (auth.role === 'dosen') {
    kelasList.value = await api.listKelasDosen(auth.user.id)
    if (kelasList.value.length) selectedKelasId.value = kelasList.value[0].id
  }
  loading.value = false
})

// ── Shared helpers ───────────────────────────────────────────────────────
const statusMeta = {
  hadir: { label: 'Hadir', color: 'var(--success)', tone: 'success' },
  izin: { label: 'Izin', color: 'var(--info)', tone: 'info' },
  sakit: { label: 'Sakit', color: 'var(--warning)', tone: 'warning' },
  alpa: { label: 'Alpa', color: 'var(--danger)', tone: 'danger' },
}
const persenColor = (p) => (p >= 85 ? 'var(--success)' : p >= 75 ? 'var(--warning)' : 'var(--danger)')
const sortedRecords = (records) => [...(records || [])].sort((a, b) => a.pertemuanKe - b.pertemuanKe)
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Perkuliahan"
      title="Presensi Kuliah"
      :subtitle="auth.role === 'dosen'
        ? 'Rekap kehadiran mahasiswa per kelas yang Anda ampu.'
        : auth.role === 'admin'
          ? 'Pemantauan kehadiran perkuliahan.'
          : 'Rekap kehadiran Anda di seluruh mata kuliah. Minimum 75% untuk berhak mengikuti ujian.'" />

    <div v-if="loading" class="text-muted flex items-center gap-2 py-10 justify-center">
      <icons.Loader2 class="animate-spin" :size="18" /> Memuat…
    </div>

    <!-- ══════════════════ MAHASISWA ══════════════════ -->
    <template v-else-if="auth.role === 'mahasiswa'">
      <template v-if="rekap.length">
        <!-- Summary -->
        <div class="grid lg:grid-cols-3 gap-4 mb-6">
          <section class="card p-5 flex items-center gap-5 lg:col-span-1">
            <Donut :value="avgKehadiran" :size="96" :stroke="10" :color="persenColor(avgKehadiran)" />
            <div>
              <div class="label-eyebrow mb-0.5">Rata-rata Kehadiran</div>
              <p class="text-sm text-muted leading-snug">Dari {{ rekap.length }} mata kuliah semester berjalan.</p>
            </div>
          </section>
          <StatCard label="Mata Kuliah Aman (≥75%)" :value="aman" icon="ShieldCheck" tone="success" />
          <StatCard label="Mata Kuliah Berisiko (<75%)" :value="berisiko" icon="AlertTriangle" :tone="berisiko ? 'danger' : 'success'" />
        </div>

        <!-- Class cards -->
        <div class="grid md:grid-cols-2 gap-4">
          <section v-for="c in rekap" :key="c.id" class="card p-5"
            :class="c.persen < 75 && 'ring-1'"
            :style="c.persen < 75 ? { boxShadow: '0 0 0 1px var(--danger)' } : {}">
            <div class="flex items-start gap-4">
              <Donut :value="c.persen" :size="72" :stroke="8" :color="persenColor(c.persen)" />
              <div class="min-w-0 flex-1">
                <h3 class="font-semibold leading-snug truncate">{{ c.mk.nama }}</h3>
                <div class="text-[0.78rem] text-faint mt-0.5">
                  <span class="num">{{ c.mk.kode }}</span> · Kelas {{ c.kelas }}
                </div>
                <div class="text-[0.78rem] text-muted flex items-center gap-1 mt-0.5 truncate">
                  <icons.User :size="12" class="shrink-0" /> {{ c.dosen?.name }}
                </div>
              </div>
            </div>

            <div v-if="c.persen < 75" class="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[0.78rem] font-medium text-danger"
              :style="{ background: 'var(--danger-soft)' }">
              <icons.AlertTriangle :size="14" class="shrink-0" /> Kehadiran di bawah 75% — berisiko tidak boleh mengikuti ujian.
            </div>

            <!-- Counts -->
            <div class="grid grid-cols-4 gap-2 mt-4">
              <div v-for="k in ['hadir', 'izin', 'sakit', 'alpa']" :key="k"
                class="rounded-xl px-2 py-2.5 text-center"
                :style="{ background: `color-mix(in oklab, ${statusMeta[k].color} 12%, transparent)` }">
                <div class="num text-lg font-bold" :style="{ color: statusMeta[k].color }">{{ c[k] }}</div>
                <div class="text-[0.68rem] text-muted">{{ statusMeta[k].label }}</div>
              </div>
            </div>

            <!-- Expand toggle -->
            <button class="mt-3 text-[0.8rem] text-brand-700 dark:text-brand-600 font-medium hover:underline flex items-center gap-1"
              @click="toggle(c.id)">
              <component :is="expandedId === c.id ? icons.ChevronUp : icons.ChevronDown" :size="14" />
              {{ expandedId === c.id ? 'Sembunyikan' : 'Rincian per pertemuan' }} ({{ c.total }} pertemuan)
            </button>
            <div v-if="expandedId === c.id" class="mt-3 pt-3 border-t border-border">
              <div class="flex flex-wrap gap-1.5">
                <span v-for="r in sortedRecords(c.records)" :key="r.pertemuanKe"
                  class="num grid h-7 w-7 place-items-center rounded-md text-[0.7rem] font-semibold text-white"
                  :style="{ background: statusMeta[r.status].color }"
                  :title="`Pertemuan ${r.pertemuanKe} — ${statusMeta[r.status].label}`">
                  {{ r.pertemuanKe }}
                </span>
              </div>
              <div class="flex flex-wrap gap-3 mt-3 text-[0.72rem] text-muted">
                <span v-for="k in ['hadir', 'izin', 'sakit', 'alpa']" :key="k" class="flex items-center gap-1.5">
                  <span class="h-2.5 w-2.5 rounded-full" :style="{ background: statusMeta[k].color }"></span>{{ statusMeta[k].label }}
                </span>
              </div>
            </div>
          </section>
        </div>
      </template>
      <div v-else class="card p-10 text-center text-faint">
        <icons.CalendarOff :size="32" class="mx-auto mb-2 opacity-60" />
        <p class="text-sm">Belum ada data presensi. Presensi muncul setelah perkuliahan berjalan.</p>
      </div>
    </template>

    <!-- ══════════════════ DOSEN ══════════════════ -->
    <template v-else-if="auth.role === 'dosen'">
      <template v-if="kelasList.length">
        <!-- Kelas selector -->
        <div class="flex sm:flex-wrap overflow-x-auto sm:overflow-visible -mx-1 px-1 gap-2 mb-5">
          <button v-for="k in kelasList" :key="k.id" @click="selectedKelasId = k.id"
            class="chip transition-colors shrink-0 whitespace-nowrap"
            :class="selectedKelasId === k.id ? 'text-white' : 'bg-surface-2 text-muted hover:text-ink'"
            :style="selectedKelasId === k.id ? { background: 'var(--brand-600)' } : {}">
            {{ k.mk.nama }} · {{ k.kelas }}
          </button>
        </div>

        <div v-if="detailLoading" class="text-muted flex items-center gap-2 py-10 justify-center">
          <icons.Loader2 class="animate-spin" :size="18" /> Memuat kelas…
        </div>

        <template v-else-if="detail">
          <!-- Kelas info + averages -->
          <div class="grid lg:grid-cols-3 gap-4 mb-6">
            <section class="card p-5 lg:col-span-2">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="font-semibold text-lg" style="font-family: var(--font-serif)">{{ detail.kelas.mk.nama }}</h3>
                  <div class="text-sm text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span class="num">{{ detail.kelas.mk.kode }}</span>
                    <span>Kelas {{ detail.kelas.kelas }}</span>
                    <span class="flex items-center gap-1"><icons.MapPin :size="13" /> {{ detail.kelas.ruang }}</span>
                    <span class="flex items-center gap-1"><icons.Clock :size="13" /> {{ detail.kelas.hari }}, {{ detail.kelas.jam }}</span>
                  </div>
                </div>
                <Chip tone="info" dot>{{ detail.roster.length }} mahasiswa</Chip>
              </div>
              <!-- Pertemuan legend -->
              <div class="mt-4 pt-4 border-t border-border">
                <div class="label-eyebrow mb-2">Pertemuan ({{ terlaksanaCount }} / {{ detail.pertemuan.length }} terlaksana)</div>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="p in detail.pertemuan" :key="p.pertemuanKe"
                    class="num grid h-7 w-7 place-items-center rounded-md text-[0.7rem] font-semibold border"
                    :class="p.terlaksana ? 'text-white border-transparent' : 'text-faint border-border'"
                    :style="p.terlaksana ? { background: 'var(--success)' } : {}"
                    :title="`Pertemuan ${p.pertemuanKe}${p.terlaksana ? ' — terlaksana' : ' — belum'}`">
                    {{ p.pertemuanKe }}
                  </span>
                </div>
              </div>
            </section>
            <section class="card p-5 flex flex-col items-center justify-center text-center">
              <Donut :value="kelasAvg" :size="110" :stroke="11" :color="persenColor(kelasAvg)" />
              <div class="label-eyebrow mt-3">Rata-rata Kehadiran Kelas</div>
            </section>
          </div>

          <!-- Roster table -->
          <section class="card p-0 overflow-hidden">
            <!-- Desktop / tablet: table -->
            <div class="hidden sm:block overflow-x-auto">
              <table class="rtable">
                <thead>
                  <tr>
                    <th class="w-10">No</th>
                    <th>NIM</th>
                    <th>Nama Mahasiswa</th>
                    <th class="text-center">Hadir / Total</th>
                    <th class="w-1/3">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(m, idx) in detail.roster" :key="m.id">
                    <td class="num text-faint">{{ idx + 1 }}</td>
                    <td class="num">{{ m.nim }}</td>
                    <td class="font-medium">{{ m.name }}</td>
                    <td class="num text-center">{{ m.hadir }} / {{ m.total }}</td>
                    <td>
                      <div class="flex items-center gap-2.5">
                        <div class="flex-1 h-2 rounded-full overflow-hidden" style="background: var(--surface-2)">
                          <div class="h-full rounded-full transition-all"
                            :style="{ width: m.persen + '%', background: persenColor(m.persen) }"></div>
                        </div>
                        <span class="num text-sm font-semibold w-11 text-right" :style="{ color: persenColor(m.persen) }">{{ m.persen }}%</span>
                        <icons.AlertTriangle v-if="m.persen < 75" :size="14" class="text-danger shrink-0" />
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!detail.roster.length">
                    <td colspan="5" class="text-center text-faint py-8">Belum ada mahasiswa terdaftar di kelas ini.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Mobile: cards -->
            <div class="sm:hidden flex flex-col gap-2.5 p-3">
              <div v-for="(m, idx) in detail.roster" :key="m.id" class="rounded-xl border border-border p-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="font-medium leading-snug">{{ m.name }}</div>
                    <div class="text-[0.72rem] text-faint num">{{ idx + 1 }} · {{ m.nim }}</div>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <span class="num text-base font-bold" :style="{ color: persenColor(m.persen) }">{{ m.persen }}%</span>
                    <icons.AlertTriangle v-if="m.persen < 75" :size="14" class="text-danger" />
                  </div>
                </div>
                <div class="flex items-center gap-2.5 mt-2.5">
                  <div class="flex-1 h-2 rounded-full overflow-hidden" style="background: var(--surface-2)">
                    <div class="h-full rounded-full transition-all"
                      :style="{ width: m.persen + '%', background: persenColor(m.persen) }"></div>
                  </div>
                  <span class="num text-[0.72rem] text-muted shrink-0">Hadir {{ m.hadir }} / {{ m.total }}</span>
                </div>
              </div>
              <p v-if="!detail.roster.length" class="text-center text-faint py-6 text-sm">Belum ada mahasiswa terdaftar di kelas ini.</p>
            </div>
          </section>
        </template>
      </template>
      <div v-else class="card p-10 text-center text-faint">
        <icons.BookOpen :size="32" class="mx-auto mb-2 opacity-60" />
        <p class="text-sm">Anda belum mengampu kelas pada tahun akademik aktif.</p>
      </div>
    </template>

    <!-- ══════════════════ ADMIN ══════════════════ -->
    <template v-else>
      <section class="card p-10 text-center max-w-lg mx-auto">
        <span class="grid h-14 w-14 mx-auto place-items-center rounded-2xl mb-4"
          :style="{ background: 'var(--info-soft)', color: 'var(--info)' }">
          <icons.ClipboardList :size="26" />
        </span>
        <h3 class="font-semibold text-lg" style="font-family: var(--font-serif)">Presensi Diakses Per Kelas</h3>
        <p class="text-sm text-muted mt-2">
          Rekapitulasi kehadiran ditinjau pada tingkat kelas oleh dosen pengampu.
          Silakan akses melalui menu jadwal atau manajemen kelas untuk melihat presensi tiap kelas.
        </p>
      </section>
    </template>
  </div>
</template>
