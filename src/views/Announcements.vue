<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api.js'
import PageHeader from '@/components/PageHeader.vue'
import Avatar from '@/components/Avatar.vue'
import Chip from '@/components/Chip.vue'
import { icons } from '@/lib/icons'

const loading = ref(true)
const items = ref([])
const kategoriAktif = ref('Semua')
const query = ref('')

onMounted(async () => {
  items.value = await api.listPengumuman()
  loading.value = false
})

const kategoriTone = {
  Akademik: 'brand',
  Keuangan: 'warning',
  Ujian: 'danger',
  Kegiatan: 'info',
}
const kategoriIcon = {
  Akademik: 'GraduationCap',
  Keuangan: 'Wallet',
  Ujian: 'FileText',
  Kegiatan: 'CalendarHeart',
}
const roleLabel = { admin: 'BAAK', dosen: 'Dosen', mahasiswa: 'Mahasiswa' }

const kategoriList = computed(() => {
  const set = [...new Set(items.value.map((p) => p.kategori))]
  return ['Semua', ...set]
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return items.value.filter((p) => {
    if (kategoriAktif.value !== 'Semua' && p.kategori !== kategoriAktif.value) return false
    if (q && !(`${p.judul} ${p.isi}`.toLowerCase().includes(q))) return false
    return true
  })
})

// Pinned first (list already sorted pin desc then tanggal desc from backend)
const pinnedCount = computed(() => filtered.value.filter((p) => p.pin).length)

const fmtTanggal = (s) =>
  new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

const relatif = (s) => {
  const then = new Date(s)
  const now = new Date('2026-07-11')
  const days = Math.round((now - then) / 86400000)
  if (days <= 0) return 'Hari ini'
  if (days === 1) return 'Kemarin'
  if (days < 7) return `${days} hari lalu`
  if (days < 30) return `${Math.floor(days / 7)} minggu lalu`
  if (days < 365) return `${Math.floor(days / 30)} bulan lalu`
  return `${Math.floor(days / 365)} tahun lalu`
}

const toneOf = (kat) => kategoriTone[kat] || 'neutral'
const iconOf = (kat) => kategoriIcon[kat] || 'Megaphone'
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Informasi Kampus"
      title="Pengumuman"
      subtitle="Kabar akademik, keuangan, ujian, dan kegiatan dari Biro Administrasi Akademik & Kemahasiswaan.">
      <template #actions>
        <span class="chip" style="background: var(--gold-soft)" v-if="!loading">
          <icons.Pin :size="13" class="text-gold" /> {{ items.filter((p) => p.pin).length }} disematkan
        </span>
      </template>
    </PageHeader>

    <div v-if="loading" class="text-muted flex items-center gap-2 py-10 justify-center">
      <icons.Loader2 class="animate-spin" :size="18" /> Memuat…
    </div>

    <template v-else>
      <!-- Filter & search -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="k in kategoriList"
            :key="k"
            type="button"
            @click="kategoriAktif = k"
            class="chip transition-colors"
            :style="kategoriAktif === k
              ? 'background: var(--brand-600); color: #fff'
              : 'background: var(--surface-2)'"
            :class="kategoriAktif === k ? 'font-semibold' : 'text-muted hover:text-ink'">
            {{ k }}
          </button>
        </div>
        <div class="relative sm:w-72">
          <icons.Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            v-model="query"
            type="text"
            placeholder="Cari pengumuman…"
            class="input pl-9" />
        </div>
      </div>

      <!-- Timeline -->
      <div v-if="filtered.length" class="relative pl-6 sm:pl-8">
        <!-- vertical line -->
        <div class="absolute left-[7px] sm:left-[9px] top-2 bottom-2 w-px bg-border" aria-hidden="true"></div>

        <article
          v-for="(p, i) in filtered"
          :key="p.id"
          class="relative mb-5 last:mb-0">
          <!-- dot -->
          <span
            class="absolute -left-6 sm:-left-8 top-5 grid place-items-center rounded-full ring-4 ring-surface"
            :style="{
              width: '15px', height: '15px',
              background: p.pin ? 'var(--gold)' : `var(--${toneOf(p.kategori) === 'neutral' ? 'faint' : toneOf(p.kategori)})`,
            }"
            aria-hidden="true"></span>

          <div
            class="card card-hover p-5"
            :style="p.pin ? 'border-color: var(--gold); background: linear-gradient(180deg, var(--gold-soft), transparent 60%)' : ''">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="flex flex-wrap items-center gap-2">
                <Chip v-if="p.pin" tone="gold" dot><icons.Pin :size="12" /> Disematkan</Chip>
                <Chip :tone="toneOf(p.kategori)">
                  <component :is="icons[iconOf(p.kategori)]" :size="12" /> {{ p.kategori }}
                </Chip>
              </div>
              <span class="text-[0.72rem] text-faint shrink-0 num whitespace-nowrap mt-0.5">{{ relatif(p.tanggal) }}</span>
            </div>

            <h3 class="text-lg leading-snug font-semibold text-balance" style="font-family: var(--font-serif)">
              {{ p.judul }}
            </h3>
            <p class="text-muted text-[0.92rem] leading-relaxed mt-1.5">{{ p.isi }}</p>

            <div class="flex items-center gap-2.5 mt-4 pt-3 border-t border-border">
              <Avatar :name="p.author?.name || 'Cendekia'" :size="30" />
              <div class="min-w-0">
                <div class="text-sm font-medium truncate">{{ p.author?.name || 'Sistem Akademik' }}</div>
                <div class="text-[0.72rem] text-faint">{{ roleLabel[p.author?.role] || 'Kampus' }}</div>
              </div>
              <div class="ml-auto flex items-center gap-1.5 text-[0.78rem] text-faint num">
                <icons.CalendarDays :size="13" /> {{ fmtTanggal(p.tanggal) }}
              </div>
            </div>
          </div>
        </article>
      </div>

      <!-- Empty state -->
      <div v-else class="card p-10 text-center text-faint">
        <icons.SearchX :size="34" class="mx-auto mb-3 opacity-60" />
        <p class="font-medium text-muted">Tidak ada pengumuman yang cocok</p>
        <p class="text-sm mt-1">Coba ubah kategori atau kata kunci pencarian.</p>
        <button
          v-if="kategoriAktif !== 'Semua' || query"
          type="button"
          class="btn btn-outline mt-4 mx-auto"
          @click="kategoriAktif = 'Semua'; query = ''">
          <icons.RotateCcw :size="15" /> Reset filter
        </button>
      </div>
    </template>
  </div>
</template>
