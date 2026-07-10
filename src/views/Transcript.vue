<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from '@/services/api.js'
import { useAuth } from '@/stores/auth.js'
import PageHeader from '@/components/PageHeader.vue'
import { icons } from '@/lib/icons'

const auth = useAuth()
const data = ref(null)
const fakultas = ref(null)
const loading = ref(true)

onMounted(async () => {
  data.value = await api.getTranscript(auth.user.id)
  try {
    const u = await api.getUser(auth.user.id)
    fakultas.value = u?.fakultas || null
  } catch (e) { /* fakultas optional */ }
  loading.value = false
})

// Grade letter → tone color (A/A- success, B+/B/B- brand/info, C+/C warning, D/E danger)
const gradeColor = (huruf) => {
  if (['A', 'A-'].includes(huruf)) return 'var(--success)'
  if (['B+', 'B', 'B-'].includes(huruf)) return 'var(--brand-600)'
  if (['C+', 'C'].includes(huruf)) return 'var(--warning)'
  if (['D', 'E'].includes(huruf)) return 'var(--danger)'
  return 'var(--muted)'
}

// Only semesters that actually have final (graded) courses.
const semesters = computed(() =>
  (data.value?.semesters || [])
    .map((s) => ({ ...s, finals: s.items.filter((i) => i.status === 'final') }))
    .filter((s) => s.finals.length)
)

const semSummary = (finals) => {
  const sks = finals.reduce((a, i) => a + i.sks, 0)
  const mutu = finals.reduce((a, i) => a + (i.mutu ?? 0) * i.sks, 0)
  const ips = sks ? mutu / sks : 0
  return { sks, mutu, ips }
}

const totalMutu = computed(() =>
  (data.value?.rows || []).reduce((a, i) => a + (i.mutu ?? 0) * i.sks, 0)
)

const predikat = computed(() => {
  const ipk = data.value?.ipk ?? 0
  if (ipk >= 3.51) return { label: 'Dengan Pujian (Cumlaude)', tone: 'var(--gold)' }
  if (ipk >= 3.01) return { label: 'Sangat Memuaskan', tone: 'var(--success)' }
  if (ipk >= 2.76) return { label: 'Memuaskan', tone: 'var(--info)' }
  return { label: 'Cukup', tone: 'var(--muted)' }
})

const cetak = () => window.print()
const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Layanan Akademik"
      title="Transkrip Akademik"
      subtitle="Rekapitulasi resmi seluruh mata kuliah yang telah lulus beserta indeks prestasi kumulatif.">
      <template #actions>
        <button class="btn btn-primary no-print" @click="cetak">
          <icons.Printer :size="17" /> Cetak / Unduh PDF
        </button>
      </template>
    </PageHeader>

    <div v-if="loading" class="text-muted flex items-center gap-2 py-10 justify-center">
      <icons.Loader2 class="animate-spin" :size="18" /> Memuat…
    </div>

    <template v-else-if="data">
      <div class="print-area card p-6 sm:p-8 max-w-4xl mx-auto">
        <!-- Official header -->
        <header class="text-center border-b-2 border-border-strong pb-5">
          <div class="flex items-center justify-center gap-3 mb-2">
            <span class="grid h-11 w-11 place-items-center rounded-xl shrink-0"
              :style="{ background: 'var(--brand-50)', color: 'var(--brand-600)' }">
              <icons.GraduationCap :size="24" />
            </span>
            <div class="text-left">
              <div class="text-[0.7rem] uppercase tracking-[0.12em] text-faint">Kementerian Pendidikan Tinggi</div>
              <div class="text-lg font-bold leading-tight" style="font-family: var(--font-serif)">Universitas Cendekia</div>
            </div>
          </div>
          <h2 class="mt-3 text-xl font-bold tracking-wide" style="font-family: var(--font-serif)">TRANSKRIP AKADEMIK</h2>
          <p class="text-[0.8rem] text-muted mt-0.5">Academic Transcript · Tahun Akademik 2025/2026</p>
        </header>

        <!-- Identity -->
        <dl class="grid sm:grid-cols-2 gap-x-8 gap-y-2.5 py-5 text-sm">
          <div class="flex justify-between gap-4 border-b border-border pb-2">
            <dt class="text-muted">Nama Mahasiswa</dt>
            <dd class="font-semibold text-right">{{ data.mahasiswa.name }}</dd>
          </div>
          <div class="flex justify-between gap-4 border-b border-border pb-2">
            <dt class="text-muted">Nomor Induk Mahasiswa</dt>
            <dd class="num font-semibold text-right">{{ data.mahasiswa.nim }}</dd>
          </div>
          <div class="flex justify-between gap-4 border-b border-border pb-2">
            <dt class="text-muted">Program Studi</dt>
            <dd class="font-semibold text-right">{{ data.prodi?.nama }}</dd>
          </div>
          <div class="flex justify-between gap-4 border-b border-border pb-2">
            <dt class="text-muted">Jenjang</dt>
            <dd class="font-semibold text-right">{{ data.prodi?.jenjang }} · {{ data.prodi?.gelar }}</dd>
          </div>
          <div v-if="fakultas" class="flex justify-between gap-4 border-b border-border pb-2 sm:col-span-2">
            <dt class="text-muted">Fakultas</dt>
            <dd class="font-semibold text-right">{{ fakultas.nama }}</dd>
          </div>
        </dl>

        <!-- Per-semester tables -->
        <div class="flex flex-col gap-7">
          <section v-for="s in semesters" :key="s.semester">
            <div class="flex items-baseline justify-between gap-3 mb-2">
              <h3 class="font-semibold" style="font-family: var(--font-serif)">
                Semester {{ s.semester }}
                <span class="text-muted font-normal text-sm">— {{ s.takaLabel }}</span>
              </h3>
              <span class="text-sm text-muted">IPS <span class="num font-bold text-ink">{{ s.ips?.toFixed(2) }}</span></span>
            </div>
            <!-- Desktop / tablet: table -->
            <div class="hidden sm:block overflow-x-auto">
              <table class="rtable">
                <thead>
                  <tr>
                    <th class="w-10">No</th>
                    <th>Kode</th>
                    <th>Mata Kuliah</th>
                    <th class="text-center">SKS</th>
                    <th class="text-center">Nilai</th>
                    <th class="text-center">Bobot</th>
                    <th class="text-right">SKS×Bobot</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(i, idx) in s.finals" :key="i.kode">
                    <td class="num text-faint">{{ idx + 1 }}</td>
                    <td class="num font-medium">{{ i.kode }}</td>
                    <td>{{ i.nama }}</td>
                    <td class="num text-center">{{ i.sks }}</td>
                    <td class="text-center">
                      <span class="num font-bold" :style="{ color: gradeColor(i.huruf) }">{{ i.huruf }}</span>
                    </td>
                    <td class="num text-center">{{ i.mutu?.toFixed(2) }}</td>
                    <td class="num text-right font-medium">{{ (i.mutu * i.sks).toFixed(2) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="font-semibold" style="background: var(--surface-2)">
                    <td colspan="3" class="text-right text-muted text-[0.8rem] uppercase tracking-wide">Subtotal Semester</td>
                    <td class="num text-center">{{ semSummary(s.finals).sks }}</td>
                    <td></td>
                    <td></td>
                    <td class="num text-right">{{ semSummary(s.finals).mutu.toFixed(2) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Mobile: cards -->
            <div class="sm:hidden flex flex-col gap-2.5">
              <div v-for="i in s.finals" :key="i.kode" class="rounded-xl border border-border p-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="font-medium leading-snug">{{ i.nama }}</div>
                    <div class="text-[0.72rem] text-faint num">{{ i.kode }}</div>
                  </div>
                  <span class="num font-bold text-base shrink-0" :style="{ color: gradeColor(i.huruf) }">{{ i.huruf }}</span>
                </div>
                <div class="grid grid-cols-3 gap-x-3 gap-y-1 mt-2.5 text-[0.8rem]">
                  <div class="flex flex-col">
                    <span class="text-faint text-[0.72rem]">SKS</span>
                    <span class="num font-medium">{{ i.sks }}</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-faint text-[0.72rem]">Bobot</span>
                    <span class="num font-medium">{{ i.mutu?.toFixed(2) }}</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-faint text-[0.72rem]">SKS×Bobot</span>
                    <span class="num font-medium">{{ (i.mutu * i.sks).toFixed(2) }}</span>
                  </div>
                </div>
              </div>
              <!-- Subtotal card -->
              <div class="rounded-xl border border-border p-3 font-semibold flex items-center justify-between gap-3"
                style="background: var(--surface-2)">
                <span class="text-muted text-[0.72rem] uppercase tracking-wide">Subtotal Semester</span>
                <span class="text-[0.8rem]">
                  <span class="num">{{ semSummary(s.finals).sks }}</span> SKS ·
                  <span class="num">{{ semSummary(s.finals).mutu.toFixed(2) }}</span> mutu
                </span>
              </div>
            </div>
          </section>

          <div v-if="!semesters.length" class="text-center py-10 text-faint">
            <icons.FileX2 :size="30" class="mx-auto mb-2 opacity-60" />
            <p class="text-sm">Belum ada nilai final yang tercatat pada transkrip.</p>
          </div>
        </div>

        <!-- Summary -->
        <div v-if="semesters.length" class="mt-8 border-t-2 border-border-strong pt-6 grid sm:grid-cols-3 gap-6 items-center">
          <div class="grid grid-cols-2 sm:grid-cols-1 gap-4 sm:col-span-2">
            <div class="flex items-baseline justify-between gap-3 border-b border-border pb-2">
              <span class="text-sm text-muted">Total SKS Lulus</span>
              <span class="num text-lg font-bold">{{ data.sksLulus }}<span class="text-sm text-muted font-normal"> / 144</span></span>
            </div>
            <div class="flex items-baseline justify-between gap-3 border-b border-border pb-2">
              <span class="text-sm text-muted">Total Bobot Mutu</span>
              <span class="num text-lg font-bold">{{ totalMutu.toFixed(2) }}</span>
            </div>
          </div>
          <div class="text-center rounded-2xl p-5"
            :style="{ background: 'var(--brand-50)' }">
            <div class="label-eyebrow mb-1">Indeks Prestasi Kumulatif</div>
            <div class="num font-bold leading-none" style="font-family: var(--font-serif); font-size: 3rem; color: var(--brand-700)">
              {{ data.ipk?.toFixed(2) }}
            </div>
            <div class="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold" :style="{ color: predikat.tone }">
              <icons.Award :size="15" /> {{ predikat.label }}
            </div>
          </div>
        </div>

        <!-- Signature / footnote -->
        <footer v-if="semesters.length" class="mt-8 flex flex-col sm:flex-row justify-between gap-6 text-sm">
          <p class="text-[0.78rem] text-faint max-w-xs leading-relaxed">
            Predikat kelulusan: IPK ≥ 3,51 Dengan Pujian; 3,01–3,50 Sangat Memuaskan; 2,76–3,00 Memuaskan.
            Dokumen ini sah tanpa tanda tangan basah sepanjang dapat diverifikasi melalui sistem SIAKAD.
          </p>
          <div class="text-center shrink-0">
            <p class="text-muted">Yogyakarta, {{ today }}</p>
            <p class="text-muted">Ketua Program Studi</p>
            <div class="h-16"></div>
            <p class="font-semibold border-t border-border-strong pt-1 inline-block px-4">{{ data.prodi?.kaprodi }}</p>
          </div>
        </footer>
      </div>
    </template>

    <div v-else class="text-center py-12 text-faint">
      <icons.FileX2 :size="30" class="mx-auto mb-2 opacity-60" />
      <p class="text-sm">Transkrip tidak tersedia.</p>
    </div>
  </div>
</template>
