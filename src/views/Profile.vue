<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api.js'
import { useAuth } from '@/stores/auth.js'
import { useUI } from '@/stores/ui.js'
import { toast } from '@/lib/toast.js'
import PageHeader from '@/components/PageHeader.vue'
import Avatar from '@/components/Avatar.vue'
import Chip from '@/components/Chip.vue'
import * as icons from 'lucide-vue-next'

const auth = useAuth()
const ui = useUI()
const loading = ref(true)
const u = ref(null)

onMounted(async () => {
  u.value = await api.getUser(auth.user.id)
  loading.value = false
})

const roleLabel = { mahasiswa: 'Mahasiswa', dosen: 'Dosen', admin: 'Staf Akademik' }
const gender = (g) => (g === 'L' ? 'Laki-laki' : g === 'P' ? 'Perempuan' : '—')

const identifier = computed(() => {
  if (!u.value) return null
  if (u.value.role === 'mahasiswa') return { label: 'NIM', value: u.value.nim }
  if (u.value.role === 'dosen') return { label: 'NIDN', value: u.value.nidn }
  return { label: 'Jabatan', value: u.value.jabatan }
})

const tglLahir = computed(() => {
  if (!u.value?.tglLahir) return '—'
  const tgl = new Date(u.value.tglLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${u.value.tempatLahir || ''}, ${tgl}`
})

// Definition-list rows. `copy: true` renders a Salin button.
const akademik = computed(() => {
  const m = u.value
  return [
    { label: 'NIM', value: m.nim, mono: true, copy: true },
    { label: 'Program Studi', value: m.prodi?.nama },
    { label: 'Fakultas', value: m.fakultas?.nama },
    { label: 'Jenjang', value: `${m.prodi?.jenjang || ''} — ${m.prodi?.gelar || ''}`.replace(/^ — |— $/, '') },
    { label: 'Angkatan', value: m.angkatan, mono: true },
    { label: 'Semester', value: `Semester ${m.semester}`, mono: true },
    { label: 'Status Akademik', value: m.statusAkademik, chip: 'success' },
    { label: 'Dosen Wali', value: m.dosenWali?.name },
    { label: 'IPK', value: Number(m.ipk).toFixed(2), mono: true, strong: true },
    { label: 'SKS Ditempuh', value: m.sksTempuh, mono: true, suffix: 'SKS' },
    { label: 'Golongan UKT', value: `Golongan ${m.ukt?.golongan}`, hint: rupiah(m.ukt?.nominal) },
  ]
})
const pribadi = computed(() => {
  const m = u.value
  return [
    { label: 'Tempat/Tgl Lahir', value: tglLahir.value },
    { label: 'Jenis Kelamin', value: gender(m.gender) },
    { label: 'Agama', value: m.agama },
    { label: 'No. HP', value: m.hp, mono: true },
    { label: 'Email', value: m.email, copy: true },
    { label: 'Alamat', value: m.alamat, wide: true },
    { label: 'NIK', value: m.nik, mono: true },
    { label: 'Nama Ayah', value: m.ayah },
    { label: 'Nama Ibu', value: m.ibu },
    { label: 'Asal Sekolah', value: m.asalSekolah },
  ]
})
const kepegawaian = computed(() => {
  const d = u.value
  return [
    { label: 'NIDN', value: d.nidn, mono: true, copy: true },
    { label: 'Program Studi', value: d.prodi?.nama },
    { label: 'Jabatan Akademik', value: d.jabatanAkademik },
    { label: 'Bidang Keahlian', value: d.bidang },
    { label: 'Dosen Wali', value: d.isWali ? 'Ya' : 'Tidak', chip: d.isWali ? 'success' : 'neutral' },
  ]
})
const kontak = computed(() => {
  const d = u.value
  return [
    { label: 'Email', value: d.email, copy: true },
    { label: 'No. HP', value: d.hp, mono: true },
  ]
})
const adminData = computed(() => {
  const a = u.value
  return [
    { label: 'Jabatan', value: a.jabatan },
    { label: 'Unit Kerja', value: a.unit, wide: true },
    { label: 'Email', value: a.email, copy: true },
    { label: 'No. HP', value: a.hp, mono: true },
  ]
})

function rupiah(n) {
  return n == null ? '—' : 'Rp' + Number(n).toLocaleString('id-ID')
}

async function salin(value, label) {
  try {
    await navigator.clipboard.writeText(String(value))
    toast(`${label} disalin ke clipboard`, { type: 'success', title: 'Tersalin' })
  } catch (e) {
    toast('Gagal menyalin', { type: 'error' })
  }
}
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Akun Saya"
      title="Biodata & Profil"
      subtitle="Data diri, akademik, dan preferensi tampilan aplikasi." />

    <div v-if="loading" class="text-muted flex items-center gap-2 py-10 justify-center">
      <icons.Loader2 class="animate-spin" :size="18" /> Memuat…
    </div>

    <template v-else>
      <!-- Banner header -->
      <section
        class="card p-6 sm:p-7 mb-6 relative overflow-hidden"
        style="background: linear-gradient(120deg, var(--brand-50), transparent 70%)">
        <div class="flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar :name="u.name" :size="84" />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2 mb-1.5">
              <Chip tone="brand" dot>{{ roleLabel[u.role] }}</Chip>
              <Chip v-if="u.role === 'mahasiswa'" tone="success" dot>{{ u.statusAkademik }}</Chip>
              <Chip v-else-if="u.role === 'dosen' && u.isWali" tone="gold" dot>
                <icons.UserCheck :size="12" /> Dosen Wali
              </Chip>
            </div>
            <h2 class="text-2xl font-bold tracking-tight text-balance" style="font-family: var(--font-serif)">
              {{ u.name }}
            </h2>
            <div v-if="identifier" class="flex items-center gap-2 mt-1.5 text-muted">
              <span class="text-[0.82rem]">{{ identifier.label }}</span>
              <span class="num font-semibold text-ink">{{ identifier.value }}</span>
            </div>
          </div>
        </div>
      </section>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Main column -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          <!-- MAHASISWA -->
          <template v-if="u.role === 'mahasiswa'">
            <section class="card p-5 sm:p-6">
              <h3 class="font-semibold mb-5 flex items-center gap-2">
                <icons.GraduationCap :size="18" class="text-brand-600" /> Data Akademik
              </h3>
              <dl class="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                <div v-for="row in akademik" :key="row.label" class="flex flex-col gap-0.5 min-w-0">
                  <dt class="text-[0.72rem] uppercase tracking-wide text-faint">{{ row.label }}</dt>
                  <dd class="flex items-center gap-2 min-w-0">
                    <Chip v-if="row.chip" :tone="row.chip" dot>{{ row.value }}</Chip>
                    <template v-else>
                      <span
                        class="min-w-0 truncate"
                        :class="[row.mono && 'num', row.strong ? 'font-bold text-lg' : 'font-medium']">
                        {{ row.value || '—' }}<span v-if="row.suffix" class="text-muted text-xs font-normal ml-1">{{ row.suffix }}</span>
                      </span>
                      <span v-if="row.hint" class="text-[0.72rem] text-faint num shrink-0">· {{ row.hint }}</span>
                    </template>
                    <button
                      v-if="row.copy"
                      type="button"
                      class="btn btn-ghost !px-1.5 !py-1 shrink-0"
                      title="Salin"
                      @click="salin(row.value, row.label)">
                      <icons.Copy :size="14" />
                    </button>
                  </dd>
                </div>
              </dl>
            </section>

            <section class="card p-5 sm:p-6">
              <h3 class="font-semibold mb-5 flex items-center gap-2">
                <icons.IdCard :size="18" class="text-brand-600" /> Data Pribadi
              </h3>
              <dl class="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                <div
                  v-for="row in pribadi"
                  :key="row.label"
                  class="flex flex-col gap-0.5 min-w-0"
                  :class="row.wide && 'sm:col-span-2'">
                  <dt class="text-[0.72rem] uppercase tracking-wide text-faint">{{ row.label }}</dt>
                  <dd class="flex items-center gap-2 min-w-0">
                    <span class="min-w-0 truncate font-medium" :class="row.mono && 'num'">{{ row.value || '—' }}</span>
                    <button
                      v-if="row.copy"
                      type="button"
                      class="btn btn-ghost !px-1.5 !py-1 shrink-0"
                      title="Salin"
                      @click="salin(row.value, row.label)">
                      <icons.Copy :size="14" />
                    </button>
                  </dd>
                </div>
              </dl>
            </section>
          </template>

          <!-- DOSEN -->
          <template v-else-if="u.role === 'dosen'">
            <section class="card p-5 sm:p-6">
              <h3 class="font-semibold mb-5 flex items-center gap-2">
                <icons.BriefcaseBusiness :size="18" class="text-brand-600" /> Data Kepegawaian
              </h3>
              <dl class="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                <div v-for="row in kepegawaian" :key="row.label" class="flex flex-col gap-0.5 min-w-0">
                  <dt class="text-[0.72rem] uppercase tracking-wide text-faint">{{ row.label }}</dt>
                  <dd class="flex items-center gap-2 min-w-0">
                    <Chip v-if="row.chip" :tone="row.chip" dot>{{ row.value }}</Chip>
                    <span v-else class="min-w-0 truncate font-medium" :class="row.mono && 'num'">{{ row.value || '—' }}</span>
                    <button
                      v-if="row.copy"
                      type="button"
                      class="btn btn-ghost !px-1.5 !py-1 shrink-0"
                      title="Salin"
                      @click="salin(row.value, row.label)">
                      <icons.Copy :size="14" />
                    </button>
                  </dd>
                </div>
              </dl>
            </section>

            <section class="card p-5 sm:p-6">
              <h3 class="font-semibold mb-5 flex items-center gap-2">
                <icons.Contact :size="18" class="text-brand-600" /> Kontak
              </h3>
              <dl class="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                <div v-for="row in kontak" :key="row.label" class="flex flex-col gap-0.5 min-w-0">
                  <dt class="text-[0.72rem] uppercase tracking-wide text-faint">{{ row.label }}</dt>
                  <dd class="flex items-center gap-2 min-w-0">
                    <span class="min-w-0 truncate font-medium" :class="row.mono && 'num'">{{ row.value || '—' }}</span>
                    <button
                      v-if="row.copy"
                      type="button"
                      class="btn btn-ghost !px-1.5 !py-1 shrink-0"
                      title="Salin"
                      @click="salin(row.value, row.label)">
                      <icons.Copy :size="14" />
                    </button>
                  </dd>
                </div>
              </dl>
            </section>
          </template>

          <!-- ADMIN -->
          <template v-else>
            <section class="card p-5 sm:p-6">
              <h3 class="font-semibold mb-5 flex items-center gap-2">
                <icons.ShieldCheck :size="18" class="text-brand-600" /> Data Kepegawaian
              </h3>
              <dl class="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                <div
                  v-for="row in adminData"
                  :key="row.label"
                  class="flex flex-col gap-0.5 min-w-0"
                  :class="row.wide && 'sm:col-span-2'">
                  <dt class="text-[0.72rem] uppercase tracking-wide text-faint">{{ row.label }}</dt>
                  <dd class="flex items-center gap-2 min-w-0">
                    <span class="min-w-0 truncate font-medium" :class="row.mono && 'num'">{{ row.value || '—' }}</span>
                    <button
                      v-if="row.copy"
                      type="button"
                      class="btn btn-ghost !px-1.5 !py-1 shrink-0"
                      title="Salin"
                      @click="salin(row.value, row.label)">
                      <icons.Copy :size="14" />
                    </button>
                  </dd>
                </div>
              </dl>
            </section>
          </template>
        </div>

        <!-- Side column: preferences -->
        <div class="flex flex-col gap-6">
          <section class="card p-5">
            <h3 class="font-semibold mb-4 flex items-center gap-2">
              <icons.Settings2 :size="18" class="text-brand-600" /> Preferensi
            </h3>
            <div class="flex flex-col gap-3">
              <!-- Tema -->
              <div class="flex items-center gap-3 rounded-xl border border-border p-3">
                <span class="grid h-10 w-10 place-items-center rounded-xl shrink-0"
                  style="background: var(--brand-50); color: var(--brand-600)">
                  <component :is="ui.dark ? icons.Moon : icons.Sun" :size="19" />
                </span>
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-sm">Tema Tampilan</div>
                  <div class="text-[0.75rem] text-faint">{{ ui.dark ? 'Mode gelap aktif' : 'Mode terang aktif' }}</div>
                </div>
                <button type="button" class="btn btn-outline" @click="ui.toggleTheme()">
                  <component :is="ui.dark ? icons.Sun : icons.Moon" :size="15" />
                  {{ ui.dark ? 'Terang' : 'Gelap' }}
                </button>
              </div>
              <!-- Suara -->
              <div class="flex items-center gap-3 rounded-xl border border-border p-3">
                <span class="grid h-10 w-10 place-items-center rounded-xl shrink-0"
                  style="background: var(--info-soft); color: var(--info)">
                  <component :is="ui.soundOn ? icons.Volume2 : icons.VolumeX" :size="19" />
                </span>
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-sm">Efek Suara</div>
                  <div class="text-[0.75rem] text-faint">{{ ui.soundOn ? 'Suara antarmuka aktif' : 'Suara dinonaktifkan' }}</div>
                </div>
                <button type="button" class="btn btn-outline" @click="ui.toggleSound()">
                  <component :is="ui.soundOn ? icons.VolumeX : icons.Volume2" :size="15" />
                  {{ ui.soundOn ? 'Matikan' : 'Nyalakan' }}
                </button>
              </div>
            </div>
            <p class="text-[0.75rem] text-faint mt-4 flex items-start gap-1.5">
              <icons.Info :size="13" class="mt-0.5 shrink-0" />
              Preferensi tersimpan otomatis di peramban ini.
            </p>
          </section>

          <section class="card p-5">
            <h3 class="font-semibold mb-3 flex items-center gap-2">
              <icons.CircleUser :size="18" class="text-brand-600" /> Akun
            </h3>
            <div class="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
              <icons.Mail :size="18" class="text-muted shrink-0" />
              <span class="text-sm truncate flex-1 min-w-0">{{ u.email }}</span>
              <button type="button" class="btn btn-ghost !px-1.5 !py-1 shrink-0" title="Salin email"
                @click="salin(u.email, 'Email')">
                <icons.Copy :size="14" />
              </button>
            </div>
            <p class="text-[0.75rem] text-faint mt-3">Perubahan data diri dilakukan melalui BAAK.</p>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
