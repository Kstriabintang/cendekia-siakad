<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api.js'
import { useAuth } from '@/stores/auth.js'
import { toast } from '@/lib/toast.js'
import { sound } from '@/lib/sound.js'
import PageHeader from '@/components/PageHeader.vue'
import Chip from '@/components/Chip.vue'
import { icons } from '@/lib/icons'

const auth = useAuth()
const krs = ref(null)
const available = ref([])
const loading = ref(true)
const busy = ref(false)

const statusTone = { Disetujui: 'success', Diajukan: 'warning', Ditolak: 'danger', Draft: 'neutral' }
const steps = ['Draft', 'Diajukan', 'Disetujui']
const canEdit = computed(() => ['Draft', 'Ditolak'].includes(krs.value?.status))
const takenKelasIds = computed(() => new Set(krs.value?.kelasIds || []))
const takenKodes = computed(() => new Set((krs.value?.items || []).map((i) => i.mkKode)))

// available classes not yet taken, grouped by mata kuliah
const availableGroups = computed(() => {
  const groups = {}
  for (const k of available.value) {
    if (takenKelasIds.value.has(k.id)) continue
    ;(groups[k.mkKode] ||= { mk: k.mk, kelas: [] }).kelas.push(k)
  }
  return Object.values(groups).sort((a, b) => a.mk.semester - b.mk.semester || a.mk.kode.localeCompare(b.mk.kode))
})

const sksPct = computed(() => krs.value ? Math.min(100, Math.round((krs.value.totalSks / krs.value.batasSks) * 100)) : 0)

// simple schedule-clash detection among chosen items
const clashes = computed(() => {
  const items = krs.value?.items || []
  const set = new Set()
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j]
    if (a.hari === b.hari && a.jamMulai < b.jamSelesai && b.jamMulai < a.jamSelesai) { set.add(a.id); set.add(b.id) }
  }
  return set
})

async function refresh() { krs.value = await api.getKrs(auth.user.id) }
onMounted(async () => {
  krs.value = await api.getKrs(auth.user.id)
  available.value = await api.listAvailableKelas(krs.value.takaId, auth.user.id)
  loading.value = false
})

async function addKelas(kelasId) {
  if (busy.value) return; busy.value = true
  try { krs.value = await api.addKelasKrs(krs.value.id, kelasId); sound.play('tick') }
  catch (e) { toast(e.message, { type: 'error' }) }
  finally { busy.value = false }
}
async function removeKelas(kelasId) {
  if (busy.value) return; busy.value = true
  try { krs.value = await api.removeKelasKrs(krs.value.id, kelasId); sound.play('click') }
  catch (e) { toast(e.message, { type: 'error' }) }
  finally { busy.value = false }
}
async function submit() {
  if (clashes.value.size) { toast('Masih ada jadwal bentrok. Perbaiki dahulu.', { type: 'error' }); return }
  busy.value = true
  try { krs.value = await api.submitKrs(krs.value.id); toast('KRS diajukan ke dosen wali untuk divalidasi.', { type: 'success', title: 'Berhasil' }) }
  catch (e) { toast(e.message, { type: 'error' }) }
  finally { busy.value = false }
}
</script>

<template>
  <div>
    <PageHeader eyebrow="Tahun Akademik 2025/2026 Ganjil" title="Kartu Rencana Studi"
      subtitle="Susun mata kuliah semester ini, lalu ajukan ke Dosen Wali untuk divalidasi.">
      <template #actions>
        <Chip v-if="krs" :tone="statusTone[krs.status]" dot>{{ krs.status }}</Chip>
        <button v-if="krs && canEdit" class="btn btn-primary" :disabled="busy || !krs.items.length" @click="submit">
          <icons.Send :size="16" /> Ajukan KRS
        </button>
      </template>
    </PageHeader>

    <div v-if="loading" class="text-muted flex items-center gap-2 py-10 justify-center"><icons.Loader2 class="animate-spin" :size="18" /> Memuat…</div>

    <template v-else>
      <!-- Stepper -->
      <div class="card p-4 mb-6 flex items-center gap-2 overflow-x-auto">
        <template v-for="(s, i) in steps" :key="s">
          <div class="flex items-center gap-2 shrink-0">
            <span class="grid h-7 w-7 place-items-center rounded-full text-[0.75rem] font-bold"
              :style="steps.indexOf(krs.status) >= i ? 'background: var(--brand-600); color:#fff' : 'background: var(--surface-2); color: var(--faint)'">
              <icons.Check v-if="steps.indexOf(krs.status) > i || krs.status === 'Disetujui' && i <= 2" :size="14" />
              <template v-else>{{ i + 1 }}</template>
            </span>
            <span class="text-sm font-medium whitespace-nowrap" :class="steps.indexOf(krs.status) >= i ? 'text-ink' : 'text-faint'">{{ s }}</span>
          </div>
          <div v-if="i < steps.length - 1" class="h-px w-8 sm:w-16 shrink-0" :style="steps.indexOf(krs.status) > i ? 'background: var(--brand-500)' : 'background: var(--border)'"></div>
        </template>
        <div v-if="krs.status === 'Ditolak'" class="ml-auto shrink-0"><Chip tone="danger" dot>Ditolak — perlu perbaikan</Chip></div>
      </div>

      <!-- Catatan dosen wali (jika ada) -->
      <div v-if="krs.catatan && (krs.status === 'Disetujui' || krs.status === 'Ditolak')" class="card p-4 mb-6 flex items-start gap-3"
        :style="krs.status === 'Ditolak' ? 'border-color: color-mix(in oklab, var(--danger) 40%, var(--border))' : ''">
        <span class="grid h-9 w-9 place-items-center rounded-lg shrink-0" :style="{ background: krs.status==='Ditolak' ? 'var(--danger-soft)' : 'var(--success-soft)', color: krs.status==='Ditolak' ? 'var(--danger)' : 'var(--success)' }">
          <icons.MessageSquareQuote :size="18" />
        </span>
        <div>
          <div class="text-sm font-semibold mb-0.5">Catatan Dosen Wali — {{ krs.dosenWali?.name }}</div>
          <p class="text-sm text-muted">{{ krs.catatan }}</p>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Chosen courses -->
        <div class="lg:col-span-2 min-w-0 flex flex-col gap-4">
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold flex items-center gap-2"><icons.ListChecks :size="18" class="text-brand-600" /> Mata Kuliah Dipilih <span class="text-faint font-normal">({{ krs.items.length }})</span></h3>
              <span class="num text-sm text-muted">{{ krs.totalSks }} / {{ krs.batasSks }} SKS</span>
            </div>

            <!-- Desktop / tablet: table -->
            <div v-if="krs.items.length" class="hidden sm:block overflow-x-auto">
              <table class="rtable">
                <thead><tr><th>Kode</th><th>Mata Kuliah</th><th>SKS</th><th>Kelas</th><th>Jadwal</th><th>Dosen</th><th v-if="canEdit"></th></tr></thead>
                <tbody>
                  <tr v-for="it in krs.items" :key="it.id" :style="clashes.has(it.id) ? 'background: var(--danger-soft)' : ''">
                    <td class="num font-medium">{{ it.mk.kode }}</td>
                    <td>
                      <div class="font-medium">{{ it.mk.nama }}</div>
                      <Chip v-if="clashes.has(it.id)" tone="danger" dot>Bentrok jadwal</Chip>
                    </td>
                    <td class="num">{{ it.sks }}</td>
                    <td>{{ it.kelas }}</td>
                    <td class="text-muted text-[0.82rem] whitespace-nowrap">{{ it.hari }}, {{ it.jam }}<br><span class="text-faint">{{ it.ruang }}</span></td>
                    <td class="text-muted text-[0.82rem]">{{ it.dosen?.name }}</td>
                    <td v-if="canEdit">
                      <button class="btn btn-ghost px-2 text-danger" title="Hapus" :disabled="busy" @click="removeKelas(it.id)"><icons.Trash2 :size="16" /></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Mobile: cards -->
            <div v-if="krs.items.length" class="sm:hidden flex flex-col gap-2.5">
              <div v-for="it in krs.items" :key="it.id" class="rounded-xl border p-3"
                :class="clashes.has(it.id) ? 'border-danger/40' : 'border-border'" :style="clashes.has(it.id) ? 'background: var(--danger-soft)' : ''">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="font-medium leading-snug">{{ it.mk.nama }}</div>
                    <div class="text-[0.72rem] text-faint num">{{ it.mk.kode }} · {{ it.sks }} SKS · Kelas {{ it.kelas }}</div>
                  </div>
                  <button v-if="canEdit" class="btn btn-ghost px-2 text-danger shrink-0 -mr-1 -mt-1" :disabled="busy" @click="removeKelas(it.id)"><icons.Trash2 :size="16" /></button>
                </div>
                <div class="mt-2 text-[0.8rem] text-muted flex flex-col gap-1">
                  <div class="flex items-center gap-1.5"><icons.Clock :size="13" class="text-faint shrink-0" /> {{ it.hari }}, {{ it.jam }}</div>
                  <div class="flex items-center gap-1.5"><icons.MapPin :size="13" class="text-faint shrink-0" /> {{ it.ruang }} · {{ it.dosen?.name }}</div>
                </div>
                <Chip v-if="clashes.has(it.id)" tone="danger" dot class="mt-2">Bentrok jadwal</Chip>
              </div>
            </div>
            <div v-else class="text-center py-10 text-faint">
              <icons.ClipboardList :size="30" class="mx-auto mb-2 opacity-60" />
              <p class="text-sm">Belum ada mata kuliah. Pilih dari daftar penawaran di samping.</p>
            </div>
          </div>
        </div>

        <!-- Sidebar: SKS meter + available -->
        <div class="flex flex-col gap-4">
          <div class="card p-5">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-sm font-medium text-muted">Beban SKS</span>
              <span class="num text-sm font-semibold">{{ krs.totalSks }} / {{ krs.batasSks }}</span>
            </div>
            <div class="h-2.5 rounded-full bg-surface-2 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500" :style="{ width: sksPct + '%', background: sksPct >= 100 ? 'var(--warning)' : 'var(--brand-500)' }"></div>
            </div>
            <p class="text-[0.75rem] text-faint mt-2">Batas {{ krs.batasSks }} SKS berdasarkan IPS lalu <span class="num">{{ krs.ipsSebelumnya?.toFixed(2) ?? '–' }}</span>.</p>
            <div v-if="canEdit" class="mt-4 pt-4 border-t border-border">
              <button class="btn btn-primary w-full" :disabled="busy || !krs.items.length || clashes.size" @click="submit"><icons.Send :size="16" /> Ajukan ke Dosen Wali</button>
              <p v-if="clashes.size" class="text-[0.75rem] text-danger mt-2 text-center">Ada jadwal bentrok — perbaiki dulu.</p>
            </div>
            <div v-else-if="krs.status === 'Diajukan'" class="mt-4 pt-4 border-t border-border flex items-center gap-2 text-warning text-sm">
              <icons.Clock :size="16" /> Menunggu persetujuan {{ krs.dosenWali?.name }}
            </div>
            <div v-else-if="krs.status === 'Disetujui'" class="mt-4 pt-4 border-t border-border flex items-center gap-2 text-success text-sm">
              <icons.CheckCircle2 :size="16" /> KRS tervalidasi · {{ krs.disetujuiAt }}
            </div>
          </div>

          <!-- Available offerings -->
          <div v-if="canEdit" class="card p-5">
            <h3 class="font-semibold mb-1 flex items-center gap-2"><icons.PlusCircle :size="18" class="text-brand-600" /> Penawaran Kelas</h3>
            <p class="text-[0.78rem] text-faint mb-4">Semester 5 · Prodi Teknik Informatika</p>
            <div class="flex flex-col gap-3 max-h-[560px] overflow-y-auto -mr-2 pr-2">
              <div v-for="g in availableGroups" :key="g.mk.kode" class="rounded-xl border border-border p-3">
                <div class="flex items-center justify-between gap-2 mb-2">
                  <div class="min-w-0">
                    <div class="font-medium text-sm truncate">{{ g.mk.nama }}</div>
                    <div class="text-[0.72rem] text-faint num">{{ g.mk.kode }} · {{ g.mk.sks }} SKS · {{ g.mk.jenis }}</div>
                  </div>
                  <Chip v-if="takenKodes.has(g.mk.kode)" tone="success" dot>Diambil</Chip>
                </div>
                <div class="flex flex-col gap-1.5">
                  <button v-for="k in g.kelas" :key="k.id" class="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-left hover:border-brand-400 hover:bg-surface-2 transition-colors disabled:opacity-50"
                    :disabled="busy || takenKodes.has(g.mk.kode)" @click="addKelas(k.id)">
                    <span class="grid h-6 w-6 place-items-center rounded-md text-[0.7rem] font-bold shrink-0" style="background: var(--brand-50); color: var(--brand-600)">{{ k.kelas }}</span>
                    <div class="min-w-0 flex-1 text-[0.76rem]">
                      <div class="truncate">{{ k.hari }}, {{ k.jam }}</div>
                      <div class="text-faint truncate">{{ k.ruang }} · {{ k.dosen?.name }}</div>
                    </div>
                    <span class="text-[0.68rem] num shrink-0" :class="k.terisi >= k.kuota ? 'text-danger' : 'text-faint'">{{ k.terisi }}/{{ k.kuota }}</span>
                    <icons.Plus :size="15" class="text-brand-600 shrink-0" />
                  </button>
                </div>
              </div>
              <p v-if="!availableGroups.length" class="text-sm text-faint text-center py-4">Semua mata kuliah yang ditawarkan sudah diambil.</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
