<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api.js'
import { useAuth } from '@/stores/auth.js'
import { toast } from '@/lib/toast.js'
import { sound } from '@/lib/sound.js'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import Chip from '@/components/Chip.vue'
import Avatar from '@/components/Avatar.vue'
import { icons } from '@/lib/icons'

const auth = useAuth()
const loading = ref(true)
const tagihan = ref([])

// admin aggregate
const adminRows = ref([])

const rupiah = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID')
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')
const fmtDateTime = (s) => {
  if (!s) return '—'
  const d = new Date(String(s).replace(' ', 'T'))
  if (isNaN(d)) return s
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Load ────────────────────────────────────────────────────────────────────
async function loadMahasiswa(id) {
  tagihan.value = await api.listTagihan(id)
}
async function loadAdmin() {
  const mhs = await api.listUsers('mahasiswa')
  const rows = await Promise.all(mhs.map(async (m) => {
    const list = await api.listTagihan(m.id)
    const belum = list.filter((t) => t.status === 'Belum')
    return {
      id: m.id, name: m.name, nim: m.nim, prodiNama: m.prodiNama,
      belumCount: belum.length,
      belumNominal: belum.reduce((s, t) => s + t.nominal, 0),
      belum,
    }
  }))
  adminRows.value = rows.sort((a, b) => b.belumNominal - a.belumNominal)
}

onMounted(async () => {
  if (auth.role === 'admin') await loadAdmin()
  else await loadMahasiswa(auth.user.id)
  loading.value = false
})

// ── Mahasiswa derived ─────────────────────────────────────────────────────────
const total = computed(() => tagihan.value.reduce((s, t) => s + t.nominal, 0))
const dibayar = computed(() => tagihan.value.filter((t) => t.status === 'Lunas').reduce((s, t) => s + t.nominal, 0))
const sisa = computed(() => tagihan.value.filter((t) => t.status === 'Belum').reduce((s, t) => s + t.nominal, 0))
const aktif = computed(() => tagihan.value.filter((t) => t.status === 'Belum').sort((a, b) => (a.jatuhTempo || '').localeCompare(b.jatuhTempo || '')))
const riwayat = computed(() => [...tagihan.value].sort((a, b) => b.semester - a.semester))

// jatuh tempo urgency relative to now
function dueInfo(s) {
  if (!s) return { tone: 'neutral', label: '—' }
  const due = new Date(s + 'T23:59:59')
  const now = new Date()
  const days = Math.ceil((due - now) / 86400000)
  if (days < 0) return { tone: 'danger', label: 'Terlewat ' + Math.abs(days) + ' hari' }
  if (days === 0) return { tone: 'danger', label: 'Jatuh tempo hari ini' }
  if (days <= 7) return { tone: 'danger', label: days + ' hari lagi' }
  if (days <= 30) return { tone: 'warning', label: days + ' hari lagi' }
  return { tone: 'info', label: days + ' hari lagi' }
}

// ── Copy VA ───────────────────────────────────────────────────────────────────
async function copyVa(va) {
  const clean = String(va).replace(/\s+/g, '')
  try {
    await navigator.clipboard.writeText(clean)
    toast('Nomor Virtual Account disalin', { type: 'success', title: 'Tersalin' })
  } catch (e) {
    toast('Gagal menyalin nomor VA', { type: 'error' })
  }
}

// ── Pay flow ──────────────────────────────────────────────────────────────────
const METODE = [
  { key: 'Virtual Account BNI', label: 'Virtual Account BNI', desc: 'Bayar via ATM / m-Banking BNI', icon: 'Landmark' },
  { key: 'Transfer Bank', label: 'Transfer Bank', desc: 'Transfer antarbank ke rekening kampus', icon: 'Building2' },
  { key: 'E-Wallet', label: 'E-Wallet', desc: 'GoPay · OVO · DANA · ShopeePay', icon: 'Smartphone' },
]
const payTarget = ref(null)
const payMetode = ref('Virtual Account BNI')
const paying = ref(false)

function openPay(t) {
  payTarget.value = t
  payMetode.value = 'Virtual Account BNI'
  sound.play('click')
}
function closePay() {
  if (paying.value) return
  payTarget.value = null
}
async function confirmPay() {
  if (!payTarget.value) return
  paying.value = true
  try {
    const jenis = payTarget.value.jenis
    await api.payTagihan(payTarget.value.id, payMetode.value)
    await loadMahasiswa(auth.user.id)
    toast('Pembayaran ' + jenis + ' berhasil', { type: 'success', title: 'Lunas' })
    payTarget.value = null
  } catch (e) {
    toast(e.message || 'Pembayaran gagal', { type: 'error' })
  } finally {
    paying.value = false
  }
}

// ── Admin derived ─────────────────────────────────────────────────────────────
const adminBelumCount = computed(() => adminRows.value.reduce((s, r) => s + r.belumCount, 0))
const adminBelumNominal = computed(() => adminRows.value.reduce((s, r) => s + r.belumNominal, 0))
const adminMhsTunggak = computed(() => adminRows.value.filter((r) => r.belumCount > 0).length)
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Keuangan · Tahun Akademik 2025/2026 Ganjil"
      :title="auth.role === 'admin' ? 'Keuangan & UKT' : 'Keuangan & UKT Saya'"
      :subtitle="auth.role === 'admin' ? 'Rekap tunggakan Uang Kuliah Tunggal seluruh mahasiswa' : 'Rincian tagihan Uang Kuliah Tunggal dan riwayat pembayaran'">
      <template #actions>
        <RouterLink to="/announcements" class="btn btn-outline"><icons.Megaphone :size="17" /> Info Keuangan</RouterLink>
      </template>
    </PageHeader>

    <div v-if="loading" class="text-muted flex items-center gap-2 py-10 justify-center">
      <icons.Loader2 class="animate-spin" :size="18" /> Memuat…
    </div>

    <!-- ══════════════════════ MAHASISWA ══════════════════════ -->
    <template v-else-if="auth.role !== 'admin'">
      <!-- Summary -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Tagihan UKT" :value="rupiah(total)" icon="Receipt" tone="brand" />
        <StatCard label="Sudah Dibayar" :value="rupiah(dibayar)" icon="CheckCircle2" tone="success" />
        <StatCard label="Sisa Tagihan" :value="rupiah(sisa)" icon="Wallet" :tone="sisa > 0 ? 'danger' : 'success'" />
      </div>

      <!-- Tagihan Aktif -->
      <section v-if="aktif.length" class="flex flex-col gap-4 mb-6">
        <div v-for="t in aktif" :key="t.id" class="card p-5 border-l-4" style="border-left-color: var(--danger)">
          <div class="flex flex-col lg:flex-row lg:items-start gap-5">
            <!-- info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <Chip tone="danger" dot>Belum Dibayar</Chip>
                <Chip tone="neutral">{{ t.takaLabel }}</Chip>
              </div>
              <h3 class="text-lg font-semibold" style="font-family: var(--font-serif)">{{ t.jenis }}</h3>
              <div class="num text-2xl font-bold mt-1" style="font-family: var(--font-serif)">{{ t.nominalStr }}</div>

              <div class="grid sm:grid-cols-2 gap-3 mt-4">
                <div class="flex items-center gap-2.5 rounded-xl border border-border p-3">
                  <icons.CalendarClock :size="18" class="text-faint shrink-0" />
                  <div class="min-w-0">
                    <div class="text-[0.72rem] text-faint">Jatuh Tempo</div>
                    <div class="text-sm font-medium">{{ fmtDate(t.jatuhTempo) }}</div>
                  </div>
                  <Chip :tone="dueInfo(t.jatuhTempo).tone" dot class="ml-auto shrink-0">{{ dueInfo(t.jatuhTempo).label }}</Chip>
                </div>
                <div class="flex items-center gap-2.5 rounded-xl border border-border p-3">
                  <icons.Hash :size="18" class="text-faint shrink-0" />
                  <div class="min-w-0 flex-1">
                    <div class="text-[0.72rem] text-faint">Virtual Account BNI</div>
                    <div class="num text-sm font-semibold tracking-wide font-mono break-all">{{ t.va }}</div>
                  </div>
                  <button class="btn btn-ghost !px-2.5 !py-2 shrink-0" title="Salin nomor VA" @click="copyVa(t.va)">
                    <icons.Copy :size="16" />
                  </button>
                </div>
              </div>
            </div>

            <!-- action -->
            <div class="lg:w-52 shrink-0 flex lg:flex-col gap-2 lg:pt-8">
              <button class="btn btn-primary w-full justify-center" @click="openPay(t)">
                <icons.CreditCard :size="17" /> Bayar Sekarang
              </button>
              <a class="btn btn-outline w-full justify-center" href="#riwayat">
                <icons.History :size="16" /> Riwayat
              </a>
            </div>
          </div>
        </div>
      </section>

      <section v-else class="card p-6 mb-6 flex items-center gap-4" style="background: var(--success-soft)">
        <span class="grid h-12 w-12 place-items-center rounded-xl shrink-0" style="background: var(--card); color: var(--success)">
          <icons.BadgeCheck :size="24" />
        </span>
        <div>
          <h3 class="font-semibold text-success">Semua tagihan lunas</h3>
          <p class="text-sm text-muted">Tidak ada tagihan UKT yang perlu dibayar saat ini. Terima kasih.</p>
        </div>
      </section>

      <!-- Riwayat -->
      <section id="riwayat" class="card p-5">
        <h3 class="font-semibold mb-4 flex items-center gap-2"><icons.History :size="18" class="text-brand-600" /> Riwayat Pembayaran</h3>
        <!-- Desktop / tablet: table -->
        <div v-if="riwayat.length" class="hidden sm:block overflow-x-auto">
          <table class="rtable">
            <thead>
              <tr>
                <th>Semester</th>
                <th>Jenis Tagihan</th>
                <th class="text-right">Nominal</th>
                <th>Status</th>
                <th>Metode</th>
                <th>Tgl Bayar</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in riwayat" :key="t.id">
                <td class="num font-medium">Semester {{ t.semester }}</td>
                <td>{{ t.jenis }}</td>
                <td class="num text-right">{{ t.nominalStr }}</td>
                <td>
                  <Chip :tone="t.status === 'Lunas' ? 'success' : 'danger'" dot>{{ t.status === 'Lunas' ? 'Lunas' : 'Belum' }}</Chip>
                </td>
                <td class="text-muted">{{ t.metode || '—' }}</td>
                <td class="num text-muted">{{ fmtDateTime(t.tglBayar) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Mobile: cards -->
        <div v-if="riwayat.length" class="sm:hidden flex flex-col gap-2.5">
          <div v-for="t in riwayat" :key="t.id" class="rounded-xl border border-border p-3">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="font-medium leading-snug">{{ t.jenis }}</div>
                <div class="text-[0.72rem] text-faint num">Semester {{ t.semester }}</div>
              </div>
              <Chip :tone="t.status === 'Lunas' ? 'success' : 'danger'" dot class="shrink-0">{{ t.status === 'Lunas' ? 'Lunas' : 'Belum' }}</Chip>
            </div>
            <div class="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5 text-[0.8rem]">
              <div class="flex justify-between"><span class="text-faint">Nominal</span><span class="num">{{ t.nominalStr }}</span></div>
              <div class="flex justify-between"><span class="text-faint">Metode</span><span class="text-right truncate">{{ t.metode || '—' }}</span></div>
              <div class="flex justify-between col-span-2"><span class="text-faint">Tgl Bayar</span><span class="num">{{ fmtDateTime(t.tglBayar) }}</span></div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-faint">
          <icons.ReceiptText :size="30" class="mx-auto mb-2 opacity-60" />
          <p class="text-sm">Belum ada tagihan tercatat.</p>
        </div>
      </section>
    </template>

    <!-- ══════════════════════ ADMIN ══════════════════════ -->
    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Tunggakan UKT" :value="rupiah(adminBelumNominal)" icon="Wallet" :tone="adminBelumNominal > 0 ? 'danger' : 'success'" />
        <StatCard label="Tagihan Belum Lunas" :value="adminBelumCount" suffix="tagihan" icon="ReceiptText" tone="warning" />
        <StatCard label="Mahasiswa Menunggak" :value="adminMhsTunggak" :suffix="'/ ' + adminRows.length" icon="Users" tone="info" />
      </div>

      <section class="card p-5">
        <div class="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 class="font-semibold flex items-center gap-2"><icons.ListChecks :size="18" class="text-brand-600" /> Status Pembayaran per Mahasiswa</h3>
          <p class="text-sm text-muted">Data tahun akademik aktif & riwayat</p>
        </div>
        <!-- Desktop / tablet: table -->
        <div v-if="adminRows.length" class="hidden sm:block overflow-x-auto">
          <table class="rtable">
            <thead>
              <tr>
                <th>Mahasiswa</th>
                <th>NIM</th>
                <th>Program Studi</th>
                <th class="text-center">Tagihan Belum</th>
                <th class="text-right">Nominal Tunggakan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in adminRows" :key="r.id">
                <td>
                  <div class="flex items-center gap-2.5">
                    <Avatar :name="r.name" :size="32" />
                    <span class="font-medium">{{ r.name }}</span>
                  </div>
                </td>
                <td class="num text-muted">{{ r.nim }}</td>
                <td class="text-muted">{{ r.prodiNama }}</td>
                <td class="num text-center">{{ r.belumCount }}</td>
                <td class="num text-right" :class="r.belumNominal > 0 ? 'text-danger font-semibold' : 'text-muted'">{{ rupiah(r.belumNominal) }}</td>
                <td>
                  <Chip :tone="r.belumCount > 0 ? 'danger' : 'success'" dot>{{ r.belumCount > 0 ? 'Menunggak' : 'Lunas' }}</Chip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Mobile: cards -->
        <div v-if="adminRows.length" class="sm:hidden flex flex-col gap-2.5">
          <div v-for="r in adminRows" :key="r.id" class="rounded-xl border border-border p-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <Avatar :name="r.name" :size="32" class="shrink-0" />
                <div class="min-w-0">
                  <div class="font-medium leading-snug truncate">{{ r.name }}</div>
                  <div class="text-[0.72rem] text-faint num">{{ r.nim }}</div>
                </div>
              </div>
              <Chip :tone="r.belumCount > 0 ? 'danger' : 'success'" dot class="shrink-0">{{ r.belumCount > 0 ? 'Menunggak' : 'Lunas' }}</Chip>
            </div>
            <div class="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5 text-[0.8rem]">
              <div class="flex justify-between col-span-2"><span class="text-faint">Program Studi</span><span class="text-right truncate">{{ r.prodiNama }}</span></div>
              <div class="flex justify-between"><span class="text-faint">Tagihan Belum</span><span class="num">{{ r.belumCount }}</span></div>
              <div class="flex justify-between"><span class="text-faint">Tunggakan</span><span class="num" :class="r.belumNominal > 0 ? 'text-danger font-semibold' : ''">{{ rupiah(r.belumNominal) }}</span></div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-faint">
          <icons.Users :size="30" class="mx-auto mb-2 opacity-60" />
          <p class="text-sm">Belum ada data mahasiswa.</p>
        </div>
      </section>

      <section class="card p-4 mt-4 flex items-center gap-3" style="background: var(--info-soft)">
        <icons.Info :size="18" class="text-info shrink-0" />
        <p class="text-sm text-muted">Pembayaran UKT dilakukan mandiri oleh mahasiswa melalui Virtual Account. BAAK hanya memantau status pelunasan.</p>
      </section>
    </template>

    <!-- ══════════════════════ PAY MODAL ══════════════════════ -->
    <Teleport to="body">
      <div v-if="payTarget" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closePay"></div>
        <div class="relative card w-full sm:max-w-md p-6 !rounded-b-none sm:!rounded-3xl">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="label-eyebrow mb-1">Pembayaran UKT</p>
              <h3 class="text-lg font-semibold" style="font-family: var(--font-serif)">{{ payTarget.jenis }}</h3>
            </div>
            <button class="btn btn-ghost !px-2 !py-2" @click="closePay" :disabled="paying"><icons.X :size="18" /></button>
          </div>

          <div class="rounded-xl border border-border p-4 mb-4 flex items-center justify-between">
            <span class="text-sm text-muted">Total tagihan</span>
            <span class="num text-xl font-bold" style="font-family: var(--font-serif)">{{ payTarget.nominalStr }}</span>
          </div>

          <p class="text-sm font-medium mb-2">Pilih metode pembayaran</p>
          <div class="flex flex-col gap-2 mb-5">
            <button v-for="m in METODE" :key="m.key" type="button"
              class="flex items-center gap-3 rounded-xl border p-3 text-left transition-colors"
              :class="payMetode === m.key ? 'border-brand-400' : 'border-border hover:bg-surface-2'"
              :style="payMetode === m.key ? { background: 'var(--brand-50)' } : {}"
              @click="payMetode = m.key">
              <span class="grid h-9 w-9 place-items-center rounded-lg shrink-0" style="background: var(--surface-2); color: var(--brand-600)">
                <component :is="icons[m.icon]" :size="18" />
              </span>
              <div class="min-w-0 flex-1">
                <div class="text-sm font-medium">{{ m.label }}</div>
                <div class="text-[0.72rem] text-faint">{{ m.desc }}</div>
              </div>
              <icons.CheckCircle2 v-if="payMetode === m.key" :size="18" class="text-brand-600 shrink-0" />
              <span v-else class="h-4 w-4 rounded-full border border-border-strong shrink-0"></span>
            </button>
          </div>

          <div class="flex gap-2">
            <button class="btn btn-outline flex-1 justify-center" @click="closePay" :disabled="paying">Batal</button>
            <button class="btn btn-primary flex-1 justify-center" @click="confirmPay" :disabled="paying">
              <icons.Loader2 v-if="paying" :size="17" class="animate-spin" />
              <icons.ShieldCheck v-else :size="17" />
              {{ paying ? 'Memproses…' : 'Konfirmasi Bayar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
