<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { api } from '@/services/api.js'
import { useAuth } from '@/stores/auth.js'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import Chip from '@/components/Chip.vue'
import Donut from '@/components/Donut.vue'
import * as icons from 'lucide-vue-next'

const auth = useAuth()
const isMahasiswa = computed(() => auth.role === 'mahasiswa')

const TARGET_SKS = 144
const prodiList = ref([])
const selectedProdiId = ref(null)
const mataKuliah = ref([])
const loading = ref(true)
const reloading = ref(false)

const search = ref('')
const jenisFilter = ref('Semua') // Semua | Wajib | Pilihan

const mahasiswaId = computed(() => (isMahasiswa.value ? auth.user.id : null))

async function loadMk() {
  if (!selectedProdiId.value) return
  reloading.value = true
  mataKuliah.value = await api.listMataKuliah({ prodiId: selectedProdiId.value, mahasiswaId: mahasiswaId.value })
  reloading.value = false
}

onMounted(async () => {
  prodiList.value = await api.listProdi()
  selectedProdiId.value = isMahasiswa.value
    ? auth.user.prodiId || prodiList.value[0]?.id
    : prodiList.value[0]?.id
  await loadMk()
  loading.value = false
})

// Dosen/admin can switch prodi → reload.
watch(selectedProdiId, (v, old) => { if (old != null) loadMk() })

// ── Derived stats (over the full curriculum, unfiltered) ─────────────────
const totalSks = computed(() => mataKuliah.value.reduce((s, m) => s + (m.sks || 0), 0))
const totalMk = computed(() => mataKuliah.value.length)
const sksLulus = computed(() =>
  mataKuliah.value.filter((m) => m.lulus).reduce((s, m) => s + (m.sks || 0), 0),
)
const progress = computed(() => Math.min(100, Math.round((sksLulus.value / TARGET_SKS) * 100)))
const prodiNama = computed(() => prodiList.value.find((p) => p.id === selectedProdiId.value)?.nama || '')

// ── Filtering + grouping by semester ─────────────────────────────────────
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return mataKuliah.value.filter((m) => {
    if (jenisFilter.value !== 'Semua' && m.jenis !== jenisFilter.value) return false
    if (!q) return true
    return m.nama.toLowerCase().includes(q) || m.kode.toLowerCase().includes(q)
  })
})

const semesters = computed(() => {
  const groups = []
  for (let s = 1; s <= 8; s++) {
    const items = filtered.value
      .filter((m) => m.semester === s)
      .sort((a, b) => a.kode.localeCompare(b.kode))
    if (!items.length) continue
    groups.push({
      semester: s,
      items,
      sks: items.reduce((sum, m) => sum + (m.sks || 0), 0),
      lulus: items.filter((m) => m.lulus).length,
    })
  }
  return groups
})

const JENIS = ['Semua', 'Wajib', 'Pilihan']
</script>

<template>
  <div>
    <PageHeader eyebrow="Akademik" title="Kurikulum & Mata Kuliah"
      :subtitle="prodiNama ? 'Program Studi ' + prodiNama + ' · Kurikulum 2023' : 'Struktur mata kuliah per semester'">
      <template #actions>
        <select v-if="!isMahasiswa && prodiList.length" v-model="selectedProdiId" class="input !w-full sm:!w-auto">
          <option v-for="p in prodiList" :key="p.id" :value="p.id">{{ p.nama }} ({{ p.jenjang }})</option>
        </select>
      </template>
    </PageHeader>

    <div v-if="loading" class="text-muted flex items-center gap-2 py-10 justify-center">
      <icons.Loader2 class="animate-spin" :size="18" /> Memuat…
    </div>

    <template v-else>
      <!-- Overview -->
      <div class="grid gap-4 mb-6" :class="isMahasiswa ? 'lg:grid-cols-3' : 'sm:grid-cols-2'">
        <StatCard label="Total SKS Kurikulum" :value="totalSks" suffix="SKS" icon="Layers" tone="brand" />
        <StatCard label="Jumlah Mata Kuliah" :value="totalMk" suffix="MK" icon="Library" tone="info" />

        <section v-if="isMahasiswa" class="card p-5 flex items-center gap-5">
          <Donut :value="progress" :size="96" :stroke="10" color="var(--success)" />
          <div class="min-w-0">
            <div class="label-eyebrow mb-1">Progres Kelulusan</div>
            <div class="flex items-baseline gap-1.5">
              <span class="num text-2xl font-bold" style="font-family: var(--font-serif)">{{ sksLulus }}</span>
              <span class="text-sm text-muted">/ {{ TARGET_SKS }} SKS</span>
            </div>
            <div class="mt-2 h-2 rounded-full bg-surface-2 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-700"
                :style="{ width: progress + '%', background: 'var(--success)' }"></div>
            </div>
            <p class="text-[0.72rem] text-faint mt-1.5">Lulus {{ progress }}% dari total kurikulum</p>
          </div>
        </section>
      </div>

      <!-- Toolbar: search + jenis filter -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div class="relative flex-1">
          <icons.Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input v-model="search" type="search" class="input !pl-9" placeholder="Cari nama atau kode mata kuliah…" />
        </div>
        <div class="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
          <button v-for="j in JENIS" :key="j" @click="jenisFilter = j"
            class="chip transition-colors whitespace-nowrap shrink-0"
            :class="jenisFilter === j ? 'text-brand-700 dark:text-brand-600 font-semibold' : 'bg-surface-2 text-muted hover:text-ink'"
            :style="jenisFilter === j ? 'background: var(--brand-50)' : ''">
            {{ j }}
          </button>
        </div>
      </div>

      <div v-if="reloading" class="text-muted flex items-center gap-2 py-8 justify-center">
        <icons.Loader2 class="animate-spin" :size="16" /> Memuat mata kuliah…
      </div>

      <!-- Empty (no match) -->
      <section v-else-if="!semesters.length" class="card p-10 text-center">
        <div class="grid place-items-center mx-auto mb-4 h-16 w-16 rounded-2xl" style="background: var(--brand-50); color: var(--brand-600)">
          <icons.SearchX :size="30" />
        </div>
        <h3 class="text-lg font-semibold mb-1" style="font-family: var(--font-serif)">Tidak ditemukan</h3>
        <p class="text-muted text-[0.95rem]">Tidak ada mata kuliah yang cocok dengan pencarian atau filter.</p>
      </section>

      <!-- Semester sections -->
      <div v-else class="flex flex-col gap-5">
        <section v-for="grp in semesters" :key="grp.semester" class="card p-0 overflow-hidden">
          <header class="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border">
            <h3 class="font-semibold flex items-center gap-2.5">
              <span class="grid h-8 w-8 place-items-center rounded-lg num text-sm font-bold shrink-0"
                style="background: var(--brand-50); color: var(--brand-600)">{{ grp.semester }}</span>
              Semester {{ grp.semester }}
            </h3>
            <div class="flex items-center gap-2">
              <Chip v-if="isMahasiswa" :tone="grp.lulus === grp.items.length ? 'success' : 'neutral'" dot>
                {{ grp.lulus }}/{{ grp.items.length }} lulus
              </Chip>
              <Chip tone="brand"><span class="num">{{ grp.sks }}</span> SKS</Chip>
            </div>
          </header>
          <!-- Desktop / tablet: table -->
          <div class="hidden sm:block overflow-x-auto">
            <table class="rtable">
              <thead>
                <tr>
                  <th class="w-24">Kode</th>
                  <th>Mata Kuliah</th>
                  <th class="text-center w-16">SKS</th>
                  <th class="w-24">Jenis</th>
                  <th>Prasyarat</th>
                  <th v-if="isMahasiswa" class="w-28">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in grp.items" :key="m.kode">
                  <td class="num font-medium text-muted">{{ m.kode }}</td>
                  <td class="font-medium text-ink">{{ m.nama }}</td>
                  <td class="text-center num">{{ m.sks }}</td>
                  <td><Chip :tone="m.jenis === 'Wajib' ? 'info' : 'gold'">{{ m.jenis }}</Chip></td>
                  <td class="text-muted text-[0.85rem]">
                    <span v-if="m.prasyaratNama && m.prasyaratNama.length">{{ m.prasyaratNama.join(', ') }}</span>
                    <span v-else class="text-faint">—</span>
                  </td>
                  <td v-if="isMahasiswa">
                    <Chip :tone="m.lulus ? 'success' : 'neutral'" dot>{{ m.lulus ? 'Lulus' : 'Belum' }}</Chip>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile: cards -->
          <div class="sm:hidden flex flex-col gap-2.5 p-3">
            <div v-for="m in grp.items" :key="m.kode" class="rounded-xl border border-border p-3">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="font-medium text-ink leading-snug">{{ m.nama }}</div>
                  <div class="text-[0.72rem] text-faint num">{{ m.kode }}</div>
                </div>
                <Chip v-if="isMahasiswa" :tone="m.lulus ? 'success' : 'neutral'" dot class="shrink-0">
                  {{ m.lulus ? 'Lulus' : 'Belum' }}
                </Chip>
              </div>
              <div class="grid grid-cols-2 gap-x-3 gap-y-2 mt-2.5 text-[0.8rem]">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-faint">SKS</span>
                  <span class="num font-medium">{{ m.sks }}</span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-faint">Jenis</span>
                  <Chip :tone="m.jenis === 'Wajib' ? 'info' : 'gold'">{{ m.jenis }}</Chip>
                </div>
                <div class="col-span-2 flex items-start justify-between gap-2">
                  <span class="text-faint shrink-0">Prasyarat</span>
                  <span v-if="m.prasyaratNama && m.prasyaratNama.length" class="text-muted text-right">{{ m.prasyaratNama.join(', ') }}</span>
                  <span v-else class="text-faint">—</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
