<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api.js'
import { useAuth } from '@/stores/auth.js'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import Donut from '@/components/Donut.vue'
import BarChart from '@/components/BarChart.vue'
import Chip from '@/components/Chip.vue'
import Avatar from '@/components/Avatar.vue'
import * as icons from 'lucide-vue-next'

const auth = useAuth()
const router = useRouter()
const stats = ref(null)
const schedule = ref([])
const pengumuman = ref([])
const khs = ref(null)
const pending = ref([])
const loading = ref(true)

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const todayName = HARI[new Date().getDay()]
const greeting = computed(() => { const h = new Date().getHours(); return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam' })
const firstName = computed(() => (auth.user?.name || '').split(' ')[0])

// schedule "today" — falls back to full week ordered if none today
const todayClasses = computed(() => schedule.value.filter((s) => s.hari === todayName))
const ipsTrend = computed(() => (khs.value?.semesters || []).filter((s) => s.ips != null).map((s) => ({ label: 'S' + s.semester, value: Math.round(s.ips * 100) / 100, highlight: false })))

onMounted(async () => {
  const p = { userId: auth.user.id, role: auth.role }
  stats.value = await api.stats(p)
  pengumuman.value = (await api.listPengumuman()).slice(0, 3)
  if (auth.role !== 'admin') schedule.value = await api.getSchedule(p)
  if (auth.role === 'mahasiswa') khs.value = await api.getKhs(auth.user.id)
  if (auth.role === 'dosen') pending.value = await api.listPendingKrs(auth.user.id)
  loading.value = false
})

const krsTone = { Disetujui: 'success', Diajukan: 'warning', Ditolak: 'danger', Draft: 'neutral' }
const rupiah = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID')
</script>

<template>
  <div>
    <PageHeader :eyebrow="todayName + ', ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })"
      :title="greeting + ', ' + firstName + ' 👋'"
      :subtitle="auth.role === 'mahasiswa' ? 'Semester ' + stats?.semester + ' · Tahun Akademik 2025/2026 Ganjil' : auth.role === 'dosen' ? 'Ringkasan aktivitas mengajar & perwalian Anda' : 'Ringkasan operasional akademik kampus'">
      <template #actions>
        <RouterLink to="/calendar" class="btn btn-outline"><icons.CalendarRange :size="17" /> Kalender</RouterLink>
        <RouterLink v-if="auth.role === 'mahasiswa'" to="/krs" class="btn btn-primary"><icons.ClipboardCheck :size="17" /> Rencana Studi</RouterLink>
        <RouterLink v-if="auth.role === 'dosen'" to="/perwalian" class="btn btn-primary"><icons.UserCheck :size="17" /> Perwalian</RouterLink>
        <RouterLink v-if="auth.role === 'admin'" to="/management" class="btn btn-primary"><icons.DatabaseZap :size="17" /> Kelola Data</RouterLink>
      </template>
    </PageHeader>

    <div v-if="loading" class="text-muted flex items-center gap-2 py-10 justify-center"><icons.Loader2 class="animate-spin" :size="18" /> Memuat…</div>

    <template v-else>
      <!-- KPI row -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <template v-if="auth.role === 'mahasiswa'">
          <StatCard label="IPK Kumulatif" :value="stats.ipk?.toFixed(2)" icon="Trophy" tone="gold" :spark="ipsTrend.map(d => d.value)" to="/transcript" />
          <StatCard label="SKS Ditempuh" :value="stats.sksTempuh" suffix="/ 144" icon="Layers" tone="brand" to="/transcript" />
          <StatCard label="SKS Semester Ini" :value="stats.sksSem" suffix="SKS" icon="BookMarked" tone="info" to="/krs" />
          <StatCard label="Rata Kehadiran" :value="stats.presensiAvg" suffix="%" icon="CalendarCheck2" tone="success" to="/attendance" />
        </template>
        <template v-else-if="auth.role === 'dosen'">
          <StatCard label="Kelas Diampu" :value="stats.kelas" icon="BookOpen" tone="brand" to="/schedule" />
          <StatCard label="Total Mahasiswa" :value="stats.mahasiswa" icon="Users" tone="info" />
          <StatCard label="Mahasiswa Bimbingan" :value="stats.bimbingan" icon="UserCheck" tone="success" to="/perwalian" />
          <StatCard label="KRS Menunggu" :value="stats.pendingKrs" icon="ClipboardList" tone="warning" to="/perwalian" />
        </template>
        <template v-else>
          <StatCard label="Mahasiswa Aktif" :value="stats.mahasiswa" icon="Users" tone="brand" to="/management" />
          <StatCard label="Dosen" :value="stats.dosen" icon="GraduationCap" tone="info" to="/management" />
          <StatCard label="KRS Menunggu Validasi" :value="stats.pendingKrs" icon="ClipboardList" tone="warning" />
          <StatCard label="Tagihan Belum Lunas" :value="stats.tagihanBelum" icon="Wallet" tone="danger" to="/payments" />
        </template>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Left / main column -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          <!-- Jadwal hari ini -->
          <section v-if="auth.role !== 'admin'" class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold flex items-center gap-2"><icons.CalendarClock :size="18" class="text-brand-600" /> Jadwal {{ auth.role === 'dosen' ? 'Mengajar' : 'Kuliah' }} Hari Ini</h3>
              <RouterLink to="/schedule" class="text-sm text-brand-700 dark:text-brand-600 font-medium hover:underline">Lihat semua →</RouterLink>
            </div>
            <div v-if="todayClasses.length" class="flex flex-col gap-2.5">
              <div v-for="c in todayClasses" :key="c.id" class="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-surface-2 transition-colors">
                <div class="text-center shrink-0 w-16">
                  <div class="num text-sm font-bold">{{ c.jamMulai }}</div>
                  <div class="text-[0.68rem] text-faint">{{ c.jamSelesai }}</div>
                </div>
                <div class="h-10 w-1 rounded-full" style="background: var(--brand-500)"></div>
                <div class="min-w-0 flex-1">
                  <div class="font-medium truncate">{{ c.mk.nama }}</div>
                  <div class="text-[0.78rem] text-faint truncate">{{ c.mk.kode }} · Kelas {{ c.kelas }} · {{ auth.role === 'dosen' ? c.ruang : c.dosen?.name }}</div>
                </div>
                <Chip tone="info" dot><icons.MapPin :size="12" /> {{ c.ruang }}</Chip>
              </div>
            </div>
            <div v-else class="text-center py-8 text-faint">
              <icons.CalendarOff :size="30" class="mx-auto mb-2 opacity-60" />
              <p class="text-sm">Tidak ada kelas hari {{ todayName }}. Nikmati harimu!</p>
            </div>
          </section>

          <!-- Admin: pintasan modul -->
          <section v-else class="card p-5">
            <h3 class="font-semibold mb-4 flex items-center gap-2"><icons.LayoutGrid :size="18" class="text-brand-600" /> Modul Cepat</h3>
            <div class="grid sm:grid-cols-2 gap-3">
              <RouterLink v-for="m in [
                {to:'/management', icon:'DatabaseZap', label:'Manajemen Data', desc:'Mahasiswa, dosen, prodi'},
                {to:'/curriculum', icon:'Library', label:'Kurikulum', desc:stats.mataKuliah + ' mata kuliah'},
                {to:'/payments', icon:'Wallet', label:'Keuangan UKT', desc:stats.tagihanBelum + ' belum lunas'},
                {to:'/announcements', icon:'Megaphone', label:'Pengumuman', desc:'Kelola pengumuman'},
              ]" :key="m.to" :to="m.to" class="flex items-center gap-3 rounded-xl border border-border p-3.5 hover:border-brand-400 hover:bg-surface-2 transition-colors">
                <span class="grid h-10 w-10 place-items-center rounded-xl shrink-0" style="background: var(--brand-50); color: var(--brand-600)"><component :is="icons[m.icon]" :size="19" /></span>
                <div><div class="font-medium text-sm">{{ m.label }}</div><div class="text-[0.75rem] text-faint">{{ m.desc }}</div></div>
              </RouterLink>
            </div>
          </section>

          <!-- IPS trend (mahasiswa) -->
          <section v-if="auth.role === 'mahasiswa' && ipsTrend.length" class="card p-5">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-semibold flex items-center gap-2"><icons.TrendingUp :size="18" class="text-brand-600" /> Tren Indeks Prestasi Semester</h3>
              <Chip tone="gold">IPK {{ khs.ipk?.toFixed(2) }}</Chip>
            </div>
            <p class="text-sm text-muted mb-4">Perkembangan IP per semester (skala 4.00)</p>
            <BarChart :data="ipsTrend.map(d => ({ ...d, value: d.value, highlight: d.label === ('S' + (stats.semester - 1)) }))" color="var(--brand-600)" :height="150" />
          </section>

          <!-- Dosen: KRS menunggu -->
          <section v-if="auth.role === 'dosen'" class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold flex items-center gap-2"><icons.ClipboardList :size="18" class="text-warning" /> KRS Menunggu Persetujuan</h3>
              <RouterLink to="/perwalian" class="text-sm text-brand-700 dark:text-brand-600 font-medium hover:underline">Proses →</RouterLink>
            </div>
            <div v-if="pending.length" class="flex flex-col gap-2">
              <div v-for="k in pending" :key="k.id" class="flex items-center gap-3 rounded-xl border border-border p-3">
                <Avatar :name="k.mahasiswa.name" :size="38" />
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-sm truncate">{{ k.mahasiswa.name }}</div>
                  <div class="text-[0.75rem] text-faint">{{ k.mahasiswa.nim }} · {{ k.totalSks }} SKS · {{ k.items.length }} MK</div>
                </div>
                <Chip tone="warning" dot>Diajukan</Chip>
              </div>
            </div>
            <div v-else class="text-center py-6 text-faint text-sm"><icons.CheckCircle2 :size="26" class="mx-auto mb-1.5 text-success" /> Semua KRS bimbingan sudah diproses.</div>
          </section>
        </div>

        <!-- Right column -->
        <div class="flex flex-col gap-6">
          <!-- Mahasiswa: KRS + tagihan -->
          <section v-if="auth.role === 'mahasiswa'" class="card p-5">
            <h3 class="font-semibold mb-4 flex items-center gap-2"><icons.ClipboardCheck :size="18" class="text-brand-600" /> Status Semester</h3>
            <div class="flex items-center justify-between py-2.5 border-b border-border">
              <span class="text-sm text-muted">Status KRS</span>
              <Chip :tone="krsTone[stats.krsStatus]" dot>{{ stats.krsStatus }}</Chip>
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-border">
              <span class="text-sm text-muted">Status Akademik</span>
              <Chip tone="success" dot>{{ stats.statusAkademik }}</Chip>
            </div>
            <div class="flex items-center justify-between py-2.5">
              <span class="text-sm text-muted">Tagihan UKT</span>
              <Chip :tone="stats.tagihanBelum ? 'danger' : 'success'" dot>{{ stats.tagihanBelum ? 'Belum Lunas' : 'Lunas' }}</Chip>
            </div>
            <RouterLink v-if="stats.tagihanBelum" to="/payments" class="mt-3 flex items-center gap-3 rounded-xl p-3 border border-danger/30" style="background: var(--danger-soft)">
              <icons.AlertTriangle :size="20" class="text-danger shrink-0" />
              <div class="min-w-0"><div class="text-sm font-semibold text-danger">Segera bayar UKT</div><div class="text-[0.75rem] text-danger/80">{{ rupiah(stats.tagihanNominal) }} · jatuh tempo 31 Agu</div></div>
            </RouterLink>
          </section>

          <!-- Presensi donut (mahasiswa) -->
          <section v-if="auth.role === 'mahasiswa'" class="card p-5 flex flex-col items-center">
            <h3 class="font-semibold mb-4 self-start flex items-center gap-2"><icons.CalendarCheck2 :size="18" class="text-brand-600" /> Kehadiran</h3>
            <Donut :value="stats.presensiAvg" :size="130" :stroke="11" color="var(--success)" />
            <p class="text-sm text-muted mt-3 text-center">Rata-rata kehadiran seluruh mata kuliah. Minimum 75% untuk ikut ujian.</p>
          </section>

          <!-- Pengumuman -->
          <section class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold flex items-center gap-2"><icons.Megaphone :size="18" class="text-brand-600" /> Pengumuman</h3>
              <RouterLink to="/announcements" class="text-sm text-brand-700 dark:text-brand-600 font-medium hover:underline">Semua →</RouterLink>
            </div>
            <div class="flex flex-col gap-3">
              <RouterLink to="/announcements" v-for="p in pengumuman" :key="p.id" class="block group">
                <div class="flex items-center gap-2 mb-1">
                  <icons.Pin v-if="p.pin" :size="13" class="text-gold" />
                  <span class="text-[0.68rem] text-faint">{{ new Date(p.tanggal).toLocaleDateString('id-ID', { day:'numeric', month:'short' }) }}</span>
                  <Chip tone="neutral">{{ p.kategori }}</Chip>
                </div>
                <div class="text-sm font-medium leading-snug group-hover:text-brand-700 dark:group-hover:text-brand-600 transition-colors">{{ p.judul }}</div>
              </RouterLink>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
