<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { api } from '@/services/api.js'
import { useAuth } from '@/stores/auth.js'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import Chip from '@/components/Chip.vue'
import Avatar from '@/components/Avatar.vue'
import { toast } from '@/lib/toast.js'
import { icons } from '@/lib/icons'

const auth = useAuth()

const loading = ref(true)
const mahasiswa = ref([])
const dosen = ref([])
const prodi = ref([])
const matakuliah = ref([])
const stats = ref(null)

const activeTab = ref('mahasiswa')
const search = ref('')
const semFilter = ref('')
const detail = ref(null) // { type, row }

const TABS = [
  { key: 'mahasiswa', label: 'Mahasiswa', icon: 'Users' },
  { key: 'dosen', label: 'Dosen', icon: 'GraduationCap' },
  { key: 'prodi', label: 'Program Studi', icon: 'Building2' },
  { key: 'matakuliah', label: 'Mata Kuliah', icon: 'Library' },
]

onMounted(async () => {
  const [mhs, dsn, prd, mk, st] = await Promise.all([
    api.listUsers('mahasiswa'),
    api.listUsers('dosen'),
    api.listProdi(),
    api.listMataKuliah({}),
    api.stats({ userId: auth.user.id, role: 'admin' }),
  ])
  mahasiswa.value = mhs
  dosen.value = dsn
  prodi.value = prd
  matakuliah.value = mk
  stats.value = st
  loading.value = false
})

// reset filters saat pindah tab
watch(activeTab, () => { search.value = ''; semFilter.value = '' })

const waliName = (id) => dosen.value.find((d) => d.id === id)?.name || '—'
const prodiName = (id) => prodi.value.find((p) => p.id === id)?.nama || '—'
const q = computed(() => search.value.trim().toLowerCase())

const akreTone = (a) => (a === 'Unggul' ? 'gold' : a === 'A' ? 'success' : 'info')

const semesters = computed(() =>
  [...new Set(matakuliah.value.map((m) => m.semester))].sort((a, b) => a - b)
)

const filteredMahasiswa = computed(() =>
  mahasiswa.value.filter((m) =>
    !q.value || m.name.toLowerCase().includes(q.value) || (m.nim || '').toLowerCase().includes(q.value)
  )
)
const filteredDosen = computed(() =>
  dosen.value.filter((d) =>
    !q.value || d.name.toLowerCase().includes(q.value) || (d.nidn || '').toLowerCase().includes(q.value)
  )
)
const filteredProdi = computed(() =>
  prodi.value.filter((p) =>
    !q.value || p.nama.toLowerCase().includes(q.value) || (p.kode || '').toLowerCase().includes(q.value)
  )
)
const filteredMatakuliah = computed(() =>
  matakuliah.value.filter((m) => {
    const okQ = !q.value || m.nama.toLowerCase().includes(q.value) || (m.kode || '').toLowerCase().includes(q.value)
    const okSem = !semFilter.value || m.semester === Number(semFilter.value)
    return okQ && okSem
  })
)

const activeCount = computed(() => ({
  mahasiswa: filteredMahasiswa.value.length,
  dosen: filteredDosen.value.length,
  prodi: filteredProdi.value.length,
  matakuliah: filteredMatakuliah.value.length,
}[activeTab.value]))
const totalCount = computed(() => ({
  mahasiswa: mahasiswa.value.length,
  dosen: dosen.value.length,
  prodi: prodi.value.length,
  matakuliah: matakuliah.value.length,
}[activeTab.value]))

const searchPlaceholder = computed(() => ({
  mahasiswa: 'Cari nama atau NIM…',
  dosen: 'Cari nama atau NIDN…',
  prodi: 'Cari nama atau kode prodi…',
  matakuliah: 'Cari nama atau kode mata kuliah…',
}[activeTab.value]))

const openDetail = (type, row) => { detail.value = { type, row } }
const closeDetail = () => { detail.value = null }

const tambah = () => {
  const label = TABS.find((t) => t.key === activeTab.value)?.label || 'Data'
  toast('Penambahan data ' + label.toLowerCase() + ' aktif setelah Supabase terhubung.', {
    type: 'info', title: 'Mode demo',
  })
}

// field rows untuk modal detail
const detailTitle = computed(() => {
  if (!detail.value) return ''
  const r = detail.value.row
  return detail.value.type === 'prodi' ? r.nama : detail.value.type === 'matakuliah' ? r.nama : r.name
})
const detailFields = computed(() => {
  if (!detail.value) return []
  const r = detail.value.row
  if (detail.value.type === 'mahasiswa') return [
    ['NIM', r.nim], ['Program Studi', r.prodiNama || prodiName(r.prodiId)], ['Angkatan', r.angkatan],
    ['Semester', r.semester], ['Status Akademik', r.statusAkademik], ['IPK', r.ipk?.toFixed(2)],
    ['SKS Ditempuh', r.sksTempuh], ['Dosen Wali', waliName(r.dosenWaliId)],
    ['Email', r.email], ['No. HP', r.hp], ['Tempat, Tgl Lahir', r.tempatLahir ? r.tempatLahir + ', ' + fmtDate(r.tglLahir) : null],
    ['Asal Sekolah', r.asalSekolah], ['Alamat', r.alamat],
  ]
  if (detail.value.type === 'dosen') return [
    ['NIDN', r.nidn], ['Program Studi', r.prodiNama || prodiName(r.prodiId)], ['Jabatan Akademik', r.jabatanAkademik],
    ['Bidang Keahlian', r.bidang], ['Dosen Wali', r.isWali ? 'Ya' : 'Tidak'], ['Kaprodi', r.kaprodi ? 'Ya' : 'Tidak'],
    ['Email', r.email], ['No. HP', r.hp],
  ]
  if (detail.value.type === 'prodi') return [
    ['Kode', r.kode], ['Jenjang', r.jenjang], ['Gelar', r.gelar], ['Akreditasi', r.akreditasi],
    ['Kaprodi', r.kaprodi], ['Total SKS Kelulusan', r.totalSksLulus],
  ]
  return [
    ['Kode', r.kode], ['SKS', r.sks], ['Semester', r.semester], ['Jenis', r.jenis],
    ['Program Studi', prodiName(r.prodiId)], ['Prasyarat', r.prasyaratNama?.length ? r.prasyaratNama.join(', ') : 'Tidak ada'],
  ]
})

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div>
    <PageHeader eyebrow="Biro Administrasi Akademik & Kemahasiswaan" title="Manajemen Data"
      subtitle="Konsol data induk kampus — mahasiswa, dosen, program studi, dan kurikulum.">
      <template #actions>
        <button class="btn btn-outline" @click="tambah"><icons.Upload :size="17" /> Impor</button>
        <button class="btn btn-primary" @click="tambah"><icons.Plus :size="17" /> Tambah Data</button>
      </template>
    </PageHeader>

    <div v-if="loading" class="text-muted flex items-center gap-2 py-10 justify-center">
      <icons.Loader2 class="animate-spin" :size="18" /> Memuat…
    </div>

    <template v-else>
      <!-- KPI row -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Mahasiswa" :value="stats.mahasiswa" icon="Users" tone="brand" />
        <StatCard label="Dosen" :value="stats.dosen" icon="GraduationCap" tone="info" />
        <StatCard label="Program Studi" :value="stats.prodi" icon="Building2" tone="gold" />
        <StatCard label="Mata Kuliah" :value="stats.mataKuliah" icon="Library" tone="success" />
        <StatCard label="KRS Menunggu Validasi" :value="stats.pendingKrs" icon="ClipboardList" tone="warning" />
        <StatCard label="Tagihan Belum Lunas" :value="stats.tagihanBelum" icon="Wallet" tone="danger" />
      </div>

      <section class="card p-5">
        <!-- Tab bar -->
        <div class="flex items-center gap-1 border-b border-border -mx-5 px-3 mb-4 overflow-x-auto">
          <button v-for="t in TABS" :key="t.key" @click="activeTab = t.key"
            class="relative flex items-center gap-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors"
            :class="activeTab === t.key ? 'text-brand-700 dark:text-brand-600' : 'text-muted hover:text-ink'">
            <component :is="icons[t.icon]" :size="16" /> {{ t.label }}
            <span class="num text-[0.7rem] px-1.5 py-0.5 rounded-full"
              :style="{ background: activeTab === t.key ? 'var(--brand-50)' : 'var(--surface-2)' }">
              {{ { mahasiswa: mahasiswa.length, dosen: dosen.length, prodi: prodi.length, matakuliah: matakuliah.length }[t.key] }}
            </span>
            <span v-if="activeTab === t.key" class="absolute left-0 right-0 -bottom-px h-0.5 rounded-full" style="background: var(--brand-600)"></span>
          </button>
        </div>

        <!-- Toolbar -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div class="relative flex-1 min-w-0">
            <icons.Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input v-model="search" :placeholder="searchPlaceholder" class="input pl-9" />
          </div>
          <select v-if="activeTab === 'matakuliah'" v-model="semFilter" class="input sm:w-44">
            <option value="">Semua Semester</option>
            <option v-for="s in semesters" :key="s" :value="s">Semester {{ s }}</option>
          </select>
          <button class="btn btn-outline shrink-0" @click="tambah"><icons.Plus :size="16" /> Tambah</button>
        </div>

        <p class="text-[0.8rem] text-faint mb-3">
          Menampilkan <span class="num font-medium text-muted">{{ activeCount }}</span> dari
          <span class="num">{{ totalCount }}</span> data.
        </p>

        <!-- Mahasiswa -->
        <div v-if="activeTab === 'mahasiswa'" class="hidden sm:block overflow-x-auto">
          <table class="rtable">
            <thead>
              <tr>
                <th>Mahasiswa</th><th>NIM</th><th>Program Studi</th><th>Angkatan</th>
                <th>Semester</th><th>Status</th><th class="text-right">IPK</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in filteredMahasiswa" :key="m.id" class="hover:bg-surface-2 transition-colors">
                <td>
                  <div class="flex items-center gap-2.5">
                    <Avatar :name="m.name" :size="34" />
                    <div class="min-w-0">
                      <div class="font-medium truncate">{{ m.name }}</div>
                      <div class="text-[0.72rem] text-faint truncate">{{ m.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="num">{{ m.nim }}</td>
                <td>{{ m.prodiNama }}</td>
                <td class="num">{{ m.angkatan }}</td>
                <td class="num">{{ m.semester }}</td>
                <td><Chip :tone="m.statusAkademik === 'Aktif' ? 'success' : 'neutral'" dot>{{ m.statusAkademik }}</Chip></td>
                <td class="num text-right font-semibold">{{ m.ipk?.toFixed(2) }}</td>
                <td class="text-right">
                  <button class="btn btn-ghost !px-2 !py-1.5" title="Lihat detail" @click="openDetail('mahasiswa', m)"><icons.Eye :size="16" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Mahasiswa · mobile cards -->
        <div v-if="activeTab === 'mahasiswa'" class="sm:hidden flex flex-col gap-2.5">
          <div v-for="m in filteredMahasiswa" :key="m.id" class="rounded-xl border border-border p-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <Avatar :name="m.name" :size="34" />
                <div class="min-w-0">
                  <div class="font-medium leading-snug truncate">{{ m.name }}</div>
                  <div class="text-[0.72rem] text-faint truncate">{{ m.email }}</div>
                </div>
              </div>
              <Chip :tone="m.statusAkademik === 'Aktif' ? 'success' : 'neutral'" dot class="shrink-0">{{ m.statusAkademik }}</Chip>
            </div>
            <div class="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5 text-[0.8rem]">
              <div class="flex justify-between gap-2"><span class="text-faint">NIM</span><span class="num truncate">{{ m.nim }}</span></div>
              <div class="flex justify-between gap-2"><span class="text-faint">Angkatan</span><span class="num">{{ m.angkatan }}</span></div>
              <div class="flex justify-between gap-2 col-span-2"><span class="text-faint">Prodi</span><span class="truncate text-right">{{ m.prodiNama }}</span></div>
              <div class="flex justify-between gap-2"><span class="text-faint">Semester</span><span class="num">{{ m.semester }}</span></div>
              <div class="flex justify-between gap-2"><span class="text-faint">IPK</span><span class="num font-semibold">{{ m.ipk?.toFixed(2) }}</span></div>
            </div>
            <button class="btn btn-outline w-full mt-3" @click="openDetail('mahasiswa', m)"><icons.Eye :size="16" /> Detail</button>
          </div>
        </div>

        <!-- Dosen -->
        <div v-if="activeTab === 'dosen'" class="hidden sm:block overflow-x-auto">
          <table class="rtable">
            <thead>
              <tr>
                <th>Dosen</th><th>NIDN</th><th>Jabatan Akademik</th><th>Bidang Keahlian</th><th>Dosen Wali</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in filteredDosen" :key="d.id" class="hover:bg-surface-2 transition-colors">
                <td>
                  <div class="flex items-center gap-2.5">
                    <Avatar :name="d.name" :size="34" />
                    <div class="min-w-0">
                      <div class="font-medium truncate">{{ d.name }}</div>
                      <div class="text-[0.72rem] text-faint truncate">{{ d.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="num">{{ d.nidn }}</td>
                <td>{{ d.jabatanAkademik }}</td>
                <td>{{ d.bidang }}</td>
                <td><Chip v-if="d.isWali" tone="success" dot>Ya</Chip><span v-else class="text-faint">—</span></td>
                <td class="text-right">
                  <button class="btn btn-ghost !px-2 !py-1.5" title="Lihat detail" @click="openDetail('dosen', d)"><icons.Eye :size="16" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Dosen · mobile cards -->
        <div v-if="activeTab === 'dosen'" class="sm:hidden flex flex-col gap-2.5">
          <div v-for="d in filteredDosen" :key="d.id" class="rounded-xl border border-border p-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <Avatar :name="d.name" :size="34" />
                <div class="min-w-0">
                  <div class="font-medium leading-snug truncate">{{ d.name }}</div>
                  <div class="text-[0.72rem] text-faint truncate">{{ d.email }}</div>
                </div>
              </div>
              <Chip v-if="d.isWali" tone="success" dot class="shrink-0">Dosen Wali</Chip>
            </div>
            <div class="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5 text-[0.8rem]">
              <div class="flex justify-between gap-2"><span class="text-faint">NIDN</span><span class="num truncate">{{ d.nidn }}</span></div>
              <div class="flex justify-between gap-2"><span class="text-faint">Jabatan</span><span class="truncate text-right">{{ d.jabatanAkademik }}</span></div>
              <div class="flex justify-between gap-2 col-span-2"><span class="text-faint">Bidang</span><span class="truncate text-right">{{ d.bidang }}</span></div>
            </div>
            <button class="btn btn-outline w-full mt-3" @click="openDetail('dosen', d)"><icons.Eye :size="16" /> Detail</button>
          </div>
        </div>

        <!-- Program Studi -->
        <div v-if="activeTab === 'prodi'" class="hidden sm:block overflow-x-auto">
          <table class="rtable">
            <thead>
              <tr>
                <th>Program Studi</th><th>Kode</th><th>Jenjang</th><th>Akreditasi</th><th>Kaprodi</th><th>Gelar</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filteredProdi" :key="p.id" class="hover:bg-surface-2 transition-colors">
                <td class="font-medium">{{ p.nama }}</td>
                <td class="num">{{ p.kode }}</td>
                <td>{{ p.jenjang }}</td>
                <td><Chip :tone="akreTone(p.akreditasi)" dot>{{ p.akreditasi }}</Chip></td>
                <td>{{ p.kaprodi }}</td>
                <td class="num">{{ p.gelar }}</td>
                <td class="text-right">
                  <button class="btn btn-ghost !px-2 !py-1.5" title="Lihat detail" @click="openDetail('prodi', p)"><icons.Eye :size="16" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Program Studi · mobile cards -->
        <div v-if="activeTab === 'prodi'" class="sm:hidden flex flex-col gap-2.5">
          <div v-for="p in filteredProdi" :key="p.id" class="rounded-xl border border-border p-3">
            <div class="flex items-start justify-between gap-2">
              <div class="font-medium leading-snug min-w-0">{{ p.nama }}</div>
              <Chip :tone="akreTone(p.akreditasi)" dot class="shrink-0">{{ p.akreditasi }}</Chip>
            </div>
            <div class="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5 text-[0.8rem]">
              <div class="flex justify-between gap-2"><span class="text-faint">Kode</span><span class="num truncate">{{ p.kode }}</span></div>
              <div class="flex justify-between gap-2"><span class="text-faint">Jenjang</span><span class="truncate text-right">{{ p.jenjang }}</span></div>
              <div class="flex justify-between gap-2"><span class="text-faint">Kaprodi</span><span class="truncate text-right">{{ p.kaprodi }}</span></div>
              <div class="flex justify-between gap-2"><span class="text-faint">Gelar</span><span class="num truncate text-right">{{ p.gelar }}</span></div>
            </div>
            <button class="btn btn-outline w-full mt-3" @click="openDetail('prodi', p)"><icons.Eye :size="16" /> Detail</button>
          </div>
        </div>

        <!-- Mata Kuliah -->
        <div v-if="activeTab === 'matakuliah'" class="hidden sm:block overflow-x-auto">
          <table class="rtable">
            <thead>
              <tr>
                <th>Kode</th><th>Nama Mata Kuliah</th><th class="text-right">SKS</th><th>Semester</th><th>Jenis</th><th>Prasyarat</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in filteredMatakuliah" :key="m.kode" class="hover:bg-surface-2 transition-colors">
                <td class="num font-medium">{{ m.kode }}</td>
                <td>{{ m.nama }}</td>
                <td class="num text-right">{{ m.sks }}</td>
                <td class="num">{{ m.semester }}</td>
                <td><Chip :tone="m.jenis === 'Wajib' ? 'brand' : 'info'">{{ m.jenis }}</Chip></td>
                <td class="text-muted text-[0.85rem]">{{ m.prasyaratNama?.length ? m.prasyaratNama.join(', ') : '—' }}</td>
                <td class="text-right">
                  <button class="btn btn-ghost !px-2 !py-1.5" title="Lihat detail" @click="openDetail('matakuliah', m)"><icons.Eye :size="16" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Mata Kuliah · mobile cards -->
        <div v-if="activeTab === 'matakuliah'" class="sm:hidden flex flex-col gap-2.5">
          <div v-for="m in filteredMatakuliah" :key="m.kode" class="rounded-xl border border-border p-3">
            <div class="flex items-start justify-between gap-2">
              <div class="font-medium leading-snug min-w-0">{{ m.nama }}</div>
              <Chip :tone="m.jenis === 'Wajib' ? 'brand' : 'info'" class="shrink-0">{{ m.jenis }}</Chip>
            </div>
            <div class="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5 text-[0.8rem]">
              <div class="flex justify-between gap-2"><span class="text-faint">Kode</span><span class="num truncate">{{ m.kode }}</span></div>
              <div class="flex justify-between gap-2"><span class="text-faint">SKS</span><span class="num">{{ m.sks }}</span></div>
              <div class="flex justify-between gap-2"><span class="text-faint">Semester</span><span class="num">{{ m.semester }}</span></div>
              <div class="flex justify-between gap-2 col-span-2"><span class="text-faint">Prasyarat</span><span class="truncate text-right">{{ m.prasyaratNama?.length ? m.prasyaratNama.join(', ') : '—' }}</span></div>
            </div>
            <button class="btn btn-outline w-full mt-3" @click="openDetail('matakuliah', m)"><icons.Eye :size="16" /> Detail</button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="activeCount === 0" class="text-center py-12 text-faint">
          <icons.SearchX :size="30" class="mx-auto mb-2 opacity-60" />
          <p class="text-sm">Tidak ada data yang cocok dengan pencarian.</p>
        </div>
      </section>
    </template>

    <!-- Detail drawer/modal -->
    <Teleport to="body">
      <div v-if="detail" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeDetail"></div>
        <div class="relative w-full sm:max-w-lg card p-0 max-h-[88vh] overflow-hidden flex flex-col rounded-b-none sm:rounded-3xl">
          <div class="flex items-start justify-between gap-3 p-5 border-b border-border">
            <div class="flex items-center gap-3 min-w-0">
              <Avatar v-if="detail.type === 'mahasiswa' || detail.type === 'dosen'" :name="detail.row.name" :size="44" />
              <span v-else class="grid h-11 w-11 place-items-center rounded-xl shrink-0"
                :style="{ background: 'var(--brand-50)', color: 'var(--brand-600)' }">
                <component :is="detail.type === 'prodi' ? icons.Building2 : icons.BookOpen" :size="21" />
              </span>
              <div class="min-w-0">
                <h3 class="font-semibold truncate" style="font-family: var(--font-serif)">{{ detailTitle }}</h3>
                <p class="text-[0.78rem] text-faint">Detail data · mode baca</p>
              </div>
            </div>
            <button class="btn btn-ghost !px-2 !py-2 shrink-0" @click="closeDetail"><icons.X :size="18" /></button>
          </div>
          <div class="p-5 overflow-y-auto">
            <dl class="grid sm:grid-cols-2 gap-x-5 gap-y-3.5">
              <div v-for="[k, v] in detailFields" :key="k">
                <dt class="text-[0.72rem] uppercase tracking-wide text-faint">{{ k }}</dt>
                <dd class="text-sm font-medium mt-0.5" :class="!v && 'text-faint'">{{ v ?? '—' }}</dd>
              </div>
            </dl>
          </div>
          <div class="p-4 border-t border-border flex items-center justify-between gap-2">
            <span class="text-[0.75rem] text-faint flex items-center gap-1.5"><icons.Lock :size="13" /> Kelola aktif setelah Supabase terhubung</span>
            <button class="btn btn-outline" @click="closeDetail">Tutup</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
