<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { api } from '@/services/api.js'
import { useAuth } from '@/stores/auth.js'
import { toast } from '@/lib/toast.js'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import Chip from '@/components/Chip.vue'
import * as icons from 'lucide-vue-next'

const auth = useAuth()
const loading = ref(true)

// mahasiswa
const khs = ref(null)
// dosen
const kelasList = ref([])
const selectedKelasId = ref(null)
const roster = ref([])
const kelasInfo = ref(null)
const savingId = ref(null)

function hurufTone(h) {
  if (['A', 'A-'].includes(h)) return 'success'
  if (['B+', 'B', 'B-'].includes(h)) return 'info'
  if (['C+', 'C'].includes(h)) return 'warning'
  if (['D', 'E'].includes(h)) return 'danger'
  return 'neutral'
}

onMounted(async () => {
  if (auth.role === 'mahasiswa') {
    khs.value = await api.getKhs(auth.user.id)
  } else if (auth.role === 'dosen') {
    kelasList.value = await api.listKelasDosen(auth.user.id)
    selectedKelasId.value = kelasList.value[0]?.id || null
  }
  loading.value = false
})

watch(selectedKelasId, async (id) => {
  if (!id) return
  const res = await api.getKelasRoster(id)
  kelasInfo.value = res.kelas
  roster.value = res.roster.map((r) => ({ ...r, komponen: { kehadiran: r.komponen?.kehadiran ?? null, tugas: r.komponen?.tugas ?? null, uts: r.komponen?.uts ?? null, uas: r.komponen?.uas ?? null } }))
}, { immediate: true })

const kelasAvg = computed(() => {
  const vals = roster.value.map((r) => r.angka).filter((a) => a != null)
  return vals.length ? Math.round(vals.reduce((s, a) => s + a, 0) / vals.length) : null
})

async function saveField(row, field, evt) {
  let v = evt.target.value === '' ? null : Math.max(0, Math.min(100, Number(evt.target.value)))
  row.komponen[field] = v
  savingId.value = row.id + field
  try {
    const res = await api.saveKomponen(selectedKelasId.value, row.id, { [field]: v })
    row.angka = res.angka; row.huruf = res.huruf; row.mutu = res.mutu
  } catch (e) { toast(e.message, { type: 'error' }) }
  finally { savingId.value = null }
}
</script>

<template>
  <div>
    <PageHeader eyebrow="Hasil Studi" :title="auth.role === 'dosen' ? 'Input Nilai Mahasiswa' : 'Nilai & Kartu Hasil Studi'"
      :subtitle="auth.role === 'dosen' ? 'Masukkan komponen nilai; nilai akhir & huruf mutu dihitung otomatis.' : 'Riwayat nilai per semester beserta Indeks Prestasi.'">
      <template #actions>
        <Chip v-if="auth.role === 'mahasiswa' && khs" tone="gold">IPK {{ khs.ipk?.toFixed(2) }}</Chip>
        <RouterLink v-if="auth.role === 'mahasiswa'" to="/transcript" class="btn btn-outline"><icons.ScrollText :size="16" /> Transkrip</RouterLink>
      </template>
    </PageHeader>

    <div v-if="loading" class="text-muted flex items-center gap-2 py-10 justify-center"><icons.Loader2 class="animate-spin" :size="18" /> Memuat…</div>

    <!-- ── MAHASISWA: KHS ─────────────────────────────────── -->
    <template v-else-if="auth.role === 'mahasiswa'">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="IPK Kumulatif" :value="khs.ipk?.toFixed(2)" icon="Trophy" tone="gold" />
        <StatCard label="SKS Lulus" :value="khs.sksLulus" suffix="/ 144" icon="Layers" tone="brand" />
        <StatCard label="Semester Selesai" :value="khs.semesters.filter(s => !s.berjalan).length" icon="CheckCircle2" tone="success" />
        <StatCard label="IPS Tertinggi" :value="Math.max(...khs.semesters.filter(s=>s.ips).map(s => s.ips)).toFixed(2)" icon="TrendingUp" tone="info" />
      </div>

      <div class="flex flex-col gap-6">
        <section v-for="s in [...khs.semesters].reverse()" :key="s.semester" class="card p-5">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div class="flex items-center gap-3">
              <span class="grid h-10 w-10 place-items-center rounded-xl font-bold num shrink-0" style="background: var(--brand-50); color: var(--brand-600)">{{ s.semester }}</span>
              <div>
                <h3 class="font-semibold">Semester {{ s.semester }}</h3>
                <p class="text-[0.78rem] text-faint">{{ s.takaLabel }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Chip v-if="s.berjalan" tone="warning" dot>Sedang berjalan</Chip>
              <Chip v-else tone="brand">IPS {{ s.ips?.toFixed(2) }}</Chip>
              <span class="num text-sm text-muted">{{ s.items.reduce((a,i)=>a+i.sks,0) }} SKS</span>
            </div>
          </div>
          <!-- Desktop / tablet: table -->
          <div class="hidden sm:block overflow-x-auto">
            <table class="rtable">
              <thead><tr><th>Kode</th><th>Mata Kuliah</th><th>SKS</th><th class="text-center">Hadir</th><th class="text-center">Tugas</th><th class="text-center">UTS</th><th class="text-center">UAS</th><th class="text-center">Angka</th><th class="text-center">Huruf</th><th class="text-center">Mutu</th></tr></thead>
              <tbody>
                <tr v-for="it in s.items" :key="it.kode">
                  <td class="num">{{ it.kode }}</td>
                  <td class="font-medium">{{ it.nama }}</td>
                  <td class="num">{{ it.sks }}</td>
                  <td class="num text-center text-muted">{{ it.komponen?.kehadiran ?? '–' }}</td>
                  <td class="num text-center text-muted">{{ it.komponen?.tugas ?? '–' }}</td>
                  <td class="num text-center text-muted">{{ it.komponen?.uts ?? '–' }}</td>
                  <td class="num text-center text-muted">{{ it.komponen?.uas ?? '–' }}</td>
                  <td class="num text-center font-semibold">{{ it.angka ?? '–' }}</td>
                  <td class="text-center"><Chip :tone="hurufTone(it.huruf)">{{ it.huruf }}</Chip></td>
                  <td class="num text-center">{{ it.mutu?.toFixed(2) ?? '–' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Mobile: cards -->
          <div class="sm:hidden flex flex-col gap-2.5">
            <div v-for="it in s.items" :key="it.kode" class="rounded-xl border border-border p-3">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="font-medium leading-snug">{{ it.nama }}</div>
                  <div class="text-[0.72rem] text-faint num">{{ it.kode }} · {{ it.sks }} SKS</div>
                </div>
                <div class="text-right shrink-0">
                  <Chip :tone="hurufTone(it.huruf)">{{ it.huruf }}</Chip>
                  <div class="num text-[0.68rem] text-faint mt-1">Angka {{ it.angka ?? '–' }} · Mutu {{ it.mutu?.toFixed(2) ?? '–' }}</div>
                </div>
              </div>
              <div class="grid grid-cols-4 gap-1.5 mt-3">
                <div v-for="c in [['Hadir','kehadiran'],['Tugas','tugas'],['UTS','uts'],['UAS','uas']]" :key="c[1]" class="rounded-lg bg-surface-2 py-1.5 text-center">
                  <div class="text-[0.58rem] text-faint uppercase tracking-wide">{{ c[0] }}</div>
                  <div class="num text-sm font-medium">{{ it.komponen?.[c[1]] ?? '–' }}</div>
                </div>
              </div>
            </div>
          </div>
          <p v-if="s.berjalan" class="text-[0.75rem] text-faint mt-3 flex items-center gap-1.5"><icons.Info :size="13" /> Nilai bersifat sementara — dihitung dari komponen yang sudah masuk; UAS belum dinilai.</p>
        </section>
      </div>
    </template>

    <!-- ── DOSEN: input nilai ─────────────────────────────── -->
    <template v-else-if="auth.role === 'dosen'">
      <div v-if="!kelasList.length" class="card p-10 text-center text-faint"><icons.BookX :size="30" class="mx-auto mb-2 opacity-60" /><p class="text-sm">Anda belum mengampu kelas pada semester aktif.</p></div>
      <template v-else>
        <div class="flex gap-2 flex-wrap mb-5">
          <button v-for="k in kelasList" :key="k.id" @click="selectedKelasId = k.id"
            class="px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors"
            :class="selectedKelasId === k.id ? 'border-brand-500 text-brand-700 dark:text-brand-600' : 'border-border text-muted hover:bg-surface-2'"
            :style="selectedKelasId === k.id ? 'background: var(--brand-50)' : ''">
            {{ k.mk.nama }} <span class="text-faint num">· {{ k.kelas }}</span>
          </button>
        </div>

        <div v-if="kelasInfo" class="card p-5">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-border">
            <div>
              <h3 class="font-semibold">{{ kelasInfo.mk.nama }} <span class="text-faint font-normal num">({{ kelasInfo.mk.kode }})</span></h3>
              <p class="text-[0.8rem] text-faint">Kelas {{ kelasInfo.kelas }} · {{ kelasInfo.hari }}, {{ kelasInfo.jam }} · {{ kelasInfo.ruang }} · {{ roster.length }} mahasiswa</p>
            </div>
            <div class="flex items-center gap-2">
              <Chip tone="neutral">Bobot: Hadir 10% · Tugas 20% · UTS 30% · UAS 40%</Chip>
              <Chip v-if="kelasAvg != null" tone="brand">Rata kelas {{ kelasAvg }}</Chip>
            </div>
          </div>
          <!-- Desktop / tablet: table -->
          <div class="hidden sm:block overflow-x-auto">
            <table class="rtable">
              <thead><tr><th>NIM</th><th>Nama</th><th class="text-center">Hadir</th><th class="text-center">Tugas</th><th class="text-center">UTS</th><th class="text-center">UAS</th><th class="text-center">Akhir</th><th class="text-center">Huruf</th></tr></thead>
              <tbody>
                <tr v-for="row in roster" :key="row.id">
                  <td class="num">{{ row.nim }}</td>
                  <td class="font-medium whitespace-nowrap">{{ row.name }}</td>
                  <td v-for="f in ['kehadiran','tugas','uts','uas']" :key="f" class="text-center">
                    <input type="number" min="0" max="100" :value="row.komponen[f]" @change="saveField(row, f, $event)"
                      class="w-16 text-center rounded-lg border border-border-strong bg-card px-1.5 py-1 text-sm num focus:outline-none focus:border-brand-500" />
                  </td>
                  <td class="num text-center font-semibold">{{ row.angka ?? '–' }}</td>
                  <td class="text-center"><Chip :tone="hurufTone(row.huruf)">{{ row.huruf || '–' }}</Chip></td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Mobile: cards with touch inputs -->
          <div class="sm:hidden flex flex-col gap-2.5">
            <div v-for="row in roster" :key="row.id" class="rounded-xl border border-border p-3">
              <div class="flex items-center justify-between gap-2 mb-3">
                <div class="min-w-0">
                  <div class="font-medium truncate">{{ row.name }}</div>
                  <div class="text-[0.72rem] text-faint num">{{ row.nim }}</div>
                </div>
                <div class="text-right shrink-0">
                  <Chip :tone="hurufTone(row.huruf)">{{ row.huruf || '–' }}</Chip>
                  <div class="num text-[0.68rem] text-faint mt-1">Akhir {{ row.angka ?? '–' }}</div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2.5">
                <label v-for="f in [['Kehadiran','kehadiran'],['Tugas','tugas'],['UTS','uts'],['UAS','uas']]" :key="f[1]" class="text-[0.72rem]">
                  <span class="text-faint">{{ f[0] }}</span>
                  <input type="number" min="0" max="100" inputmode="numeric" :value="row.komponen[f[1]]" @change="saveField(row, f[1], $event)"
                    class="w-full text-center rounded-lg border border-border-strong bg-card px-2 py-2 num mt-1 focus:outline-none focus:border-brand-500" />
                </label>
              </div>
            </div>
          </div>
          <p class="text-[0.75rem] text-faint mt-3 flex items-center gap-1.5"><icons.Save :size="13" /> Perubahan tersimpan otomatis. Nilai akhir & huruf mutu dihitung real-time.</p>
        </div>
      </template>
    </template>
  </div>
</template>
