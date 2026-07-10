<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api.js'
import { useAuth } from '@/stores/auth.js'
import { toast } from '@/lib/toast.js'
import PageHeader from '@/components/PageHeader.vue'
import Chip from '@/components/Chip.vue'
import Avatar from '@/components/Avatar.vue'
import { icons } from '@/lib/icons'

const auth = useAuth()
const loading = ref(true)
const busy = ref(false)

// dosen state
const waliKrs = ref([])
const advisees = ref([])
const selectedId = ref(null)
const catatan = ref('')
const tab = ref('validasi') // validasi | bimbingan

// mahasiswa state
const myKrs = ref(null)
const me = ref(null)

const statusTone = { Disetujui: 'success', Diajukan: 'warning', Ditolak: 'danger', Draft: 'neutral' }
const selected = computed(() => waliKrs.value.find((k) => k.id === selectedId.value) || null)
const pendingCount = computed(() => waliKrs.value.filter((k) => k.status === 'Diajukan').length)

onMounted(async () => {
  if (auth.role === 'dosen') {
    waliKrs.value = await api.listWaliKrs(auth.user.id)
    const all = await api.listUsers('mahasiswa')
    advisees.value = all.filter((u) => u.dosenWaliId === auth.user.id)
    selectedId.value = waliKrs.value.find((k) => k.status === 'Diajukan')?.id || waliKrs.value[0]?.id || null
    catatan.value = selected.value?.catatan || ''
  } else {
    me.value = await api.getUser(auth.user.id)
    myKrs.value = await api.getKrs(auth.user.id)
  }
  loading.value = false
})

function select(k) { selectedId.value = k.id; catatan.value = k.catatan || '' }

async function decide(action) {
  if (!selected.value || busy.value) return
  busy.value = true
  try {
    const fn = action === 'approve' ? api.approveKrs : api.rejectKrs
    const updated = await fn(selected.value.id, catatan.value)
    const i = waliKrs.value.findIndex((k) => k.id === updated.id)
    if (i >= 0) waliKrs.value[i] = updated
    toast(action === 'approve' ? 'KRS disetujui.' : 'KRS dikembalikan untuk perbaikan.', { type: action === 'approve' ? 'success' : 'info', title: updated.mahasiswa.name })
  } catch (e) { toast(e.message, { type: 'error' }) }
  finally { busy.value = false }
}
</script>

<template>
  <div>
    <PageHeader eyebrow="Perwalian Akademik" :title="auth.role === 'dosen' ? 'Perwalian & Validasi KRS' : 'Dosen Wali Saya'"
      :subtitle="auth.role === 'dosen' ? 'Validasi rencana studi dan pantau mahasiswa bimbingan Anda.' : 'Informasi pembimbing akademik dan status rencana studi Anda.'">
      <template #actions>
        <Chip v-if="auth.role === 'dosen' && pendingCount" tone="warning" dot>{{ pendingCount }} menunggu</Chip>
      </template>
    </PageHeader>

    <div v-if="loading" class="text-muted flex items-center gap-2 py-10 justify-center"><icons.Loader2 class="animate-spin" :size="18" /> Memuat…</div>

    <!-- ── DOSEN ─────────────────────────────────────────── -->
    <template v-else-if="auth.role === 'dosen'">
      <div class="flex gap-1 mb-5 border-b border-border">
        <button v-for="t in [['validasi','Validasi KRS'],['bimbingan','Mahasiswa Bimbingan']]" :key="t[0]"
          class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
          :class="tab === t[0] ? 'border-brand-600 text-brand-700 dark:text-brand-600' : 'border-transparent text-muted hover:text-ink'"
          @click="tab = t[0]">{{ t[1] }}<span v-if="t[0]==='validasi' && pendingCount" class="ml-1.5 num chip" style="background:var(--warning-soft); color:var(--warning)">{{ pendingCount }}</span></button>
      </div>

      <!-- Validasi -->
      <div v-if="tab === 'validasi'" class="grid lg:grid-cols-3 gap-6">
        <div class="flex flex-col gap-2">
          <p class="label-eyebrow px-1">Antrean KRS</p>
          <button v-for="k in waliKrs" :key="k.id" @click="select(k)"
            class="card p-3 flex items-center gap-3 text-left transition-colors" :class="selectedId === k.id ? 'ring-2' : 'card-hover'"
            :style="selectedId === k.id ? 'outline: none; box-shadow: 0 0 0 2px var(--brand-500)' : ''">
            <Avatar :name="k.mahasiswa.name" :size="40" />
            <div class="min-w-0 flex-1">
              <div class="font-medium text-sm truncate">{{ k.mahasiswa.name }}</div>
              <div class="text-[0.72rem] text-faint num">{{ k.mahasiswa.nim }} · {{ k.totalSks }} SKS</div>
            </div>
            <Chip :tone="statusTone[k.status]" dot>{{ k.status }}</Chip>
          </button>
          <p v-if="!waliKrs.length" class="text-sm text-faint text-center py-6">Belum ada KRS dari mahasiswa bimbingan.</p>
        </div>

        <div class="lg:col-span-2">
          <div v-if="selected" class="card p-5">
            <div class="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-border">
              <div class="flex items-center gap-3">
                <Avatar :name="selected.mahasiswa.name" :size="46" />
                <div>
                  <div class="font-semibold">{{ selected.mahasiswa.name }}</div>
                  <div class="text-[0.8rem] text-faint num">{{ selected.mahasiswa.nim }} · Semester {{ selected.semester }} · IPK {{ selected.mahasiswa.ipk?.toFixed(2) }}</div>
                </div>
              </div>
              <Chip :tone="statusTone[selected.status]" dot>{{ selected.status }}</Chip>
            </div>

            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium">{{ selected.items.length }} mata kuliah</span>
              <span class="num text-sm" :class="selected.totalSks > selected.batasSks ? 'text-danger' : 'text-muted'">{{ selected.totalSks }} / {{ selected.batasSks }} SKS · IPS lalu {{ selected.ipsSebelumnya?.toFixed(2) }}</span>
            </div>
            <!-- Desktop / tablet: table -->
            <div class="hidden sm:block overflow-x-auto">
              <table class="rtable">
                <thead><tr><th>Kode</th><th>Mata Kuliah</th><th>SKS</th><th>Kelas</th><th>Jadwal</th></tr></thead>
                <tbody>
                  <tr v-for="it in selected.items" :key="it.id">
                    <td class="num">{{ it.mk.kode }}</td><td class="font-medium">{{ it.mk.nama }}</td>
                    <td class="num">{{ it.sks }}</td><td>{{ it.kelas }}</td>
                    <td class="text-muted text-[0.8rem] whitespace-nowrap">{{ it.hari }}, {{ it.jam }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Mobile: cards -->
            <div class="sm:hidden flex flex-col gap-2.5">
              <div v-for="it in selected.items" :key="it.id" class="rounded-xl border border-border p-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="font-medium leading-snug min-w-0">{{ it.mk.nama }}</div>
                  <Chip tone="neutral" class="shrink-0"><span class="num">{{ it.sks }}</span> SKS</Chip>
                </div>
                <div class="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5 text-[0.8rem]">
                  <div class="flex justify-between"><span class="text-faint">Kode</span><span class="num">{{ it.mk.kode }}</span></div>
                  <div class="flex justify-between"><span class="text-faint">Kelas</span><span>{{ it.kelas }}</span></div>
                  <div class="flex justify-between col-span-2"><span class="text-faint">Jadwal</span><span class="text-muted text-right">{{ it.hari }}, {{ it.jam }}</span></div>
                </div>
              </div>
            </div>

            <div class="mt-5 pt-4 border-t border-border">
              <label class="text-[0.8rem] font-medium text-muted mb-1.5 block">Catatan untuk mahasiswa</label>
              <textarea v-model="catatan" rows="2" class="input" placeholder="Mis. pertahankan IP, perhatikan MK prasyarat…"></textarea>
              <div v-if="selected.status === 'Diajukan'" class="flex flex-col sm:flex-row gap-2 mt-3">
                <button class="btn btn-primary flex-1 justify-center" :disabled="busy" @click="decide('approve')"><icons.CheckCircle2 :size="17" /> Setujui KRS</button>
                <button class="btn btn-danger w-full sm:w-auto justify-center" :disabled="busy" @click="decide('reject')"><icons.XCircle :size="17" /> Kembalikan</button>
              </div>
              <div v-else class="mt-3 text-sm flex items-center gap-2" :class="selected.status === 'Disetujui' ? 'text-success' : 'text-muted'">
                <component :is="selected.status === 'Disetujui' ? icons.CheckCircle2 : icons.Info" :size="16" />
                <span v-if="selected.status === 'Disetujui'">Disetujui pada {{ selected.disetujuiAt }}</span>
                <span v-else>Status: {{ selected.status }}</span>
              </div>
            </div>
          </div>
          <div v-else class="card p-10 text-center text-faint"><icons.MousePointerClick :size="30" class="mx-auto mb-2 opacity-60" /><p class="text-sm">Pilih KRS mahasiswa untuk memvalidasi.</p></div>
        </div>
      </div>

      <!-- Bimbingan -->
      <div v-else class="card p-5">
        <!-- Desktop / tablet: table -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="rtable">
            <thead><tr><th>Mahasiswa</th><th>NIM</th><th>Semester</th><th>IPK</th><th>SKS</th><th>Status</th><th>KRS Semester Ini</th></tr></thead>
            <tbody>
              <tr v-for="m in advisees" :key="m.id">
                <td><div class="flex items-center gap-2.5"><Avatar :name="m.name" :size="32" /><span class="font-medium">{{ m.name }}</span></div></td>
                <td class="num">{{ m.nim }}</td>
                <td class="num">{{ m.semester }}</td>
                <td class="num font-semibold">{{ m.ipk?.toFixed(2) }}</td>
                <td class="num">{{ m.sksTempuh }}</td>
                <td><Chip tone="success" dot>{{ m.statusAkademik }}</Chip></td>
                <td>
                  <Chip :tone="statusTone[(waliKrs.find(k => k.mahasiswaId === m.id) || {}).status] || 'neutral'" dot>
                    {{ (waliKrs.find(k => k.mahasiswaId === m.id) || {}).status || 'Belum mengisi' }}
                  </Chip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Mobile: cards -->
        <div class="sm:hidden flex flex-col gap-2.5">
          <div v-for="m in advisees" :key="m.id" class="rounded-xl border border-border p-3">
            <div class="flex items-center gap-2.5">
              <Avatar :name="m.name" :size="36" class="shrink-0" />
              <div class="min-w-0 flex-1">
                <div class="font-medium leading-snug truncate">{{ m.name }}</div>
                <div class="text-[0.72rem] text-faint num">{{ m.nim }} · Semester {{ m.semester }}</div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5 text-[0.8rem]">
              <div class="flex justify-between"><span class="text-faint">IPK</span><span class="num font-semibold">{{ m.ipk?.toFixed(2) }}</span></div>
              <div class="flex justify-between"><span class="text-faint">SKS</span><span class="num">{{ m.sksTempuh }}</span></div>
              <div class="flex justify-between items-center"><span class="text-faint">Status</span><Chip tone="success" dot>{{ m.statusAkademik }}</Chip></div>
              <div class="flex justify-between items-center"><span class="text-faint">KRS</span>
                <Chip :tone="statusTone[(waliKrs.find(k => k.mahasiswaId === m.id) || {}).status] || 'neutral'" dot>
                  {{ (waliKrs.find(k => k.mahasiswaId === m.id) || {}).status || 'Belum mengisi' }}
                </Chip>
              </div>
            </div>
          </div>
        </div>
        <p v-if="!advisees.length" class="text-sm text-faint text-center py-6">Belum ada mahasiswa bimbingan.</p>
      </div>
    </template>

    <!-- ── MAHASISWA ─────────────────────────────────────── -->
    <template v-else>
      <div class="grid lg:grid-cols-3 gap-6">
        <div class="card p-6 flex flex-col items-center text-center">
          <Avatar :name="me.dosenWali?.name || '?'" :size="80" />
          <h3 class="font-semibold mt-4 text-lg" style="font-family: var(--font-serif)">{{ me.dosenWali?.name }}</h3>
          <p class="text-sm text-muted">{{ me.dosenWali?.jabatanAkademik }}</p>
          <Chip tone="brand" class="mt-2">Dosen Wali / Pembimbing Akademik</Chip>
          <div class="w-full mt-5 pt-5 border-t border-border flex flex-col gap-2.5 text-sm text-left">
            <div class="flex items-center gap-2.5 text-muted"><icons.Hash :size="15" class="text-faint" /> NIDN <span class="num ml-auto text-ink">{{ me.dosenWali?.nidn }}</span></div>
            <div class="flex items-center gap-2.5 text-muted"><icons.Sparkles :size="15" class="text-faint" /> Bidang <span class="ml-auto text-ink">{{ me.dosenWali?.bidang }}</span></div>
            <div class="flex items-center gap-2.5 text-muted"><icons.Mail :size="15" class="text-faint" /> Email <span class="ml-auto text-ink truncate">{{ me.dosenWali?.email }}</span></div>
          </div>
        </div>

        <div class="lg:col-span-2 flex flex-col gap-6">
          <div class="card p-5">
            <h3 class="font-semibold mb-4 flex items-center gap-2"><icons.ClipboardCheck :size="18" class="text-brand-600" /> Status Rencana Studi</h3>
            <div class="flex items-center justify-between py-2.5 border-b border-border"><span class="text-sm text-muted">Tahun Akademik</span><span class="text-sm font-medium">{{ myKrs.takaLabel }}</span></div>
            <div class="flex items-center justify-between py-2.5 border-b border-border"><span class="text-sm text-muted">Status KRS</span><Chip :tone="statusTone[myKrs.status]" dot>{{ myKrs.status }}</Chip></div>
            <div class="flex items-center justify-between py-2.5 border-b border-border"><span class="text-sm text-muted">Total SKS</span><span class="num text-sm font-medium">{{ myKrs.totalSks }} SKS</span></div>
            <div class="flex items-center justify-between py-2.5"><span class="text-sm text-muted">Divalidasi</span><span class="text-sm">{{ myKrs.disetujuiAt || '—' }}</span></div>
            <RouterLink to="/krs" class="btn btn-outline w-full mt-4"><icons.ArrowRight :size="16" /> Buka KRS</RouterLink>
          </div>

          <div v-if="myKrs.catatan" class="card p-5 flex items-start gap-3">
            <span class="grid h-9 w-9 place-items-center rounded-lg shrink-0" style="background: var(--brand-50); color: var(--brand-600)"><icons.MessageSquareQuote :size="18" /></span>
            <div><div class="text-sm font-semibold mb-0.5">Catatan Dosen Wali</div><p class="text-sm text-muted">{{ myKrs.catatan }}</p></div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
