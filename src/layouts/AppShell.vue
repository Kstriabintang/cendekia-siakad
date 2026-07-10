<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth.js'
import { useUI } from '@/stores/ui.js'
import { IS_MOCK, api } from '@/services/api.js'
import { sound } from '@/lib/sound.js'
import Avatar from '@/components/Avatar.vue'
import AtomicBackground from '@/components/AtomicBackground.vue'
import AuroraBackground from '@/components/AuroraBackground.vue'
import Toasts from '@/components/Toasts.vue'
import CommandPalette from '@/components/CommandPalette.vue'
import PwaInstall from '@/components/PwaInstall.vue'
import { icons } from '@/lib/icons'

const auth = useAuth()
const ui = useUI()
const route = useRoute()
const router = useRouter()

const mobileOpen = ref(false)
const profileOpen = ref(false)
const notifOpen = ref(false)

const roleLabel = { admin: 'Administrator Akademik', dosen: 'Dosen', mahasiswa: 'Mahasiswa' }

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { to: '/krs', label: 'Rencana Studi (KRS)', icon: 'ClipboardCheck', roles: ['mahasiswa'] },
  { to: '/perwalian', label: 'Perwalian', icon: 'UserCheck', roles: ['mahasiswa', 'dosen'] },
  { to: '/schedule', label: 'Jadwal Kuliah', icon: 'CalendarDays', roles: ['mahasiswa', 'dosen', 'admin'] },
  { to: '/curriculum', label: 'Kurikulum & MK', icon: 'Library' },
  { to: '/grades', label: 'Nilai & KHS', icon: 'GraduationCap', roles: ['mahasiswa', 'dosen'] },
  { to: '/transcript', label: 'Transkrip', icon: 'ScrollText', roles: ['mahasiswa'] },
  { to: '/attendance', label: 'Presensi', icon: 'CalendarCheck2', roles: ['mahasiswa', 'dosen'] },
  { to: '/payments', label: 'Keuangan (UKT)', icon: 'Wallet', roles: ['mahasiswa', 'admin'] },
  { to: '/calendar', label: 'Kalender Akademik', icon: 'CalendarRange' },
  { to: '/announcements', label: 'Pengumuman', icon: 'Megaphone' },
  { to: '/management', label: 'Manajemen Data', icon: 'DatabaseZap', roles: ['admin'] },
]
const visibleNav = computed(() => nav.filter((n) => !n.roles || n.roles.includes(auth.role)))
const Icon = (n) => icons[n] || icons.Circle
const pageTitle = computed(() => route.meta.title || 'Cendekia SIAKAD')

const cmdOpen = ref(false)
const notifs = ref([])

async function buildNotifs() {
  if (!auth.user) return
  const p = { userId: auth.user.id, role: auth.role }
  const out = []
  try {
    if (auth.role === 'mahasiswa') {
      const [s, tagihan] = await Promise.all([api.stats(p), api.listTagihan(auth.user.id)])
      const belum = tagihan.find((t) => t.status === 'Belum')
      if (belum) out.push({ icon: 'Wallet', tone: 'var(--danger)', title: 'Tagihan UKT belum lunas', desc: `${belum.jenis} · ${belum.nominalStr}`, to: '/payments', time: 'Baru' })
      if (s.krsStatus === 'Disetujui') out.push({ icon: 'CheckCircle2', tone: 'var(--success)', title: 'KRS Anda telah disetujui', desc: 'Rencana studi tervalidasi dosen wali', to: '/krs', time: '' })
      else if (s.krsStatus === 'Ditolak') out.push({ icon: 'AlertTriangle', tone: 'var(--danger)', title: 'KRS dikembalikan', desc: 'Perlu perbaikan — buka KRS', to: '/krs', time: '' })
      else if (s.krsStatus === 'Diajukan') out.push({ icon: 'Clock', tone: 'var(--warning)', title: 'KRS menunggu persetujuan', desc: 'Menunggu validasi dosen wali', to: '/krs', time: '' })
      if (s.presensiAvg < 80) out.push({ icon: 'CalendarCheck2', tone: 'var(--warning)', title: 'Perhatikan kehadiran', desc: `Rata-rata ${s.presensiAvg}% · min 75% untuk ujian`, to: '/attendance', time: '' })
    } else if (auth.role === 'dosen') {
      const pend = await api.listPendingKrs(auth.user.id)
      if (pend.length) out.push({ icon: 'ClipboardList', tone: 'var(--warning)', title: `${pend.length} KRS menunggu validasi`, desc: 'Dari mahasiswa bimbingan Anda', to: '/perwalian', time: 'Baru' })
      out.push({ icon: 'CalendarClock', tone: 'var(--info)', title: 'Jadwal mengajar aktif', desc: 'Semester 2025/2026 Ganjil', to: '/schedule', time: '' })
    } else {
      const s = await api.stats(p)
      if (s.pendingKrs) out.push({ icon: 'ClipboardList', tone: 'var(--warning)', title: `${s.pendingKrs} KRS menunggu validasi`, desc: 'Perlu ditindaklanjuti dosen wali', to: '/management', time: 'Baru' })
      if (s.tagihanBelum) out.push({ icon: 'Wallet', tone: 'var(--danger)', title: `${s.tagihanBelum} tagihan belum lunas`, desc: 'Perlu tindak lanjut keuangan', to: '/payments', time: '' })
    }
  } catch (e) {}
  notifs.value = out
}
onMounted(buildNotifs)

function navClick() { sound.play('tick') }
function openCmd() { sound.play('click'); cmdOpen.value = true }
function toggleNotif() { notifOpen.value = !notifOpen.value; if (notifOpen.value) sound.play('notify') }
function go(to) { sound.play('click'); router.push(to); mobileOpen.value = false; profileOpen.value = false }
function logout() { sound.play('click'); auth.logout(); router.push('/login') }
</script>

<template>
  <div class="relative min-h-screen bg-surface text-ink flex">
    <Toasts />
    <CommandPalette v-model:open="cmdOpen" />
    <PwaInstall />
    <AuroraBackground class="!fixed" style="z-index:0" :dark="ui.dark" />
    <AtomicBackground class="!fixed" style="z-index:0" :opacity="ui.dark ? 0.30 : 0.10" :density="0.5" :atoms="2" :neurons="8"
      :primary="ui.dark ? [70, 208, 188] : [16, 130, 118]" :accent="ui.dark ? [236, 181, 78] : [200, 150, 60]" />

    <!-- Sidebar (desktop) -->
    <aside class="relative z-10 hidden lg:flex flex-col border-r border-border bg-card/95 backdrop-blur-sm transition-all duration-300"
           :class="ui.sidebarCollapsed ? 'w-[76px]' : 'w-[268px]'">
      <div class="h-16 flex items-center gap-2.5 px-4 border-b border-border">
        <div class="grid h-9 w-9 place-items-center rounded-xl shrink-0 relative" style="background: var(--brand-600)">
          <svg viewBox="0 0 32 32" class="h-5 w-5"><path d="M16 6 L27 11 L16 16 L5 11 Z" fill="white"/><path d="M9 14 L9 20 Q16 24 23 20 L23 14" fill="none" stroke="white" stroke-width="1.8"/></svg>
          <span class="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card" style="background: var(--gold)"></span>
        </div>
        <div v-if="!ui.sidebarCollapsed" class="leading-tight">
          <div class="font-bold tracking-tight" style="font-family: var(--font-serif)">Cendekia</div>
          <div class="text-[0.62rem] text-faint font-semibold tracking-[0.14em] uppercase">SIAKAD</div>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
        <p v-if="!ui.sidebarCollapsed" class="label-eyebrow px-3 pt-2 pb-1">Menu Akademik</p>
        <RouterLink v-for="n in visibleNav" :key="n.to" :to="n.to" @click="navClick"
          class="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9rem] font-medium transition-colors"
          :class="route.path.startsWith(n.to) ? 'text-brand-700 dark:text-brand-600' : 'text-muted hover:text-ink hover:bg-surface-2'"
          :style="route.path.startsWith(n.to) ? 'background: var(--brand-50)' : ''"
          :title="ui.sidebarCollapsed ? n.label : ''">
          <span v-if="route.path.startsWith(n.to)" class="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full" style="background: var(--brand-600)"></span>
          <component :is="Icon(n.icon)" :size="20" :stroke-width="route.path.startsWith(n.to) ? 2.3 : 2" class="shrink-0" />
          <span v-if="!ui.sidebarCollapsed">{{ n.label }}</span>
        </RouterLink>
      </nav>

      <div class="p-3 border-t border-border">
        <RouterLink to="/profile" @click="navClick" class="flex items-center gap-2.5 rounded-xl p-2 hover:bg-surface-2 transition-colors" :class="ui.sidebarCollapsed && 'justify-center'">
          <Avatar :name="auth.user?.name" :size="34" />
          <div v-if="!ui.sidebarCollapsed" class="min-w-0 leading-tight">
            <div class="text-[0.82rem] font-semibold truncate">{{ auth.user?.name }}</div>
            <div class="text-[0.7rem] text-faint truncate">{{ roleLabel[auth.role] }}</div>
          </div>
        </RouterLink>
        <button class="btn btn-ghost w-full mt-1" :class="ui.sidebarCollapsed && 'px-0'" @click="ui.toggleSidebar()">
          <component :is="ui.sidebarCollapsed ? icons.PanelLeftOpen : icons.PanelLeftClose" :size="18" />
          <span v-if="!ui.sidebarCollapsed" class="text-[0.8rem]">Ciutkan</span>
        </button>
      </div>
    </aside>

    <!-- Mobile drawer -->
    <transition name="fade">
      <div v-if="mobileOpen" class="fixed inset-0 z-40 lg:hidden">
        <div class="absolute inset-0 bg-black/40" @click="mobileOpen = false"></div>
        <aside class="absolute left-0 top-0 h-full w-[280px] bg-card border-r border-border p-3 flex flex-col gap-1 overflow-y-auto">
          <div class="flex items-center gap-2.5 px-2 py-3 mb-1">
            <div class="grid h-9 w-9 place-items-center rounded-xl" style="background: var(--brand-600)">
              <svg viewBox="0 0 32 32" class="h-5 w-5"><path d="M16 6 L27 11 L16 16 L5 11 Z" fill="white"/></svg>
            </div>
            <span class="font-bold" style="font-family: var(--font-serif)">Cendekia <span class="text-faint text-xs font-semibold">SIAKAD</span></span>
          </div>
          <RouterLink v-for="n in visibleNav" :key="n.to" :to="n.to" @click="() => { navClick(); mobileOpen = false }"
            class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9rem] font-medium"
            :class="route.path.startsWith(n.to) ? 'text-brand-700 dark:text-brand-600' : 'text-muted'"
            :style="route.path.startsWith(n.to) ? 'background: var(--brand-50)' : ''">
            <component :is="Icon(n.icon)" :size="20" /> {{ n.label }}
          </RouterLink>
        </aside>
      </div>
    </transition>

    <!-- Main -->
    <div class="relative z-10 flex-1 min-w-0 flex flex-col">
      <header class="sticky top-0 z-30 h-16 flex items-center gap-3 px-4 sm:px-6 border-b border-border bg-card/95 backdrop-blur-none sm:bg-card/80 sm:backdrop-blur-md safe-top safe-x">
        <button class="btn btn-ghost lg:hidden px-2" @click="mobileOpen = true"><icons.Menu :size="20" /></button>
        <h2 class="font-semibold text-[1.05rem] truncate">{{ pageTitle }}</h2>

        <div class="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button class="hidden md:flex items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 py-2 w-56 text-muted hover:border-brand-400 hover:text-ink transition-colors" @click="openCmd">
            <icons.Search :size="16" />
            <span class="text-sm flex-1 text-left">Cari halaman, MK…</span>
            <kbd class="text-[0.6rem] font-mono text-faint border border-border rounded px-1">⌘K</kbd>
          </button>
          <button class="btn btn-ghost px-2.5 md:hidden" title="Cari" @click="openCmd"><icons.Search :size="19" /></button>

          <span v-if="IS_MOCK" class="chip text-gold hidden sm:inline-flex" style="background: var(--gold-soft)" title="Menjalankan data contoh — hubungkan Supabase untuk data nyata">
            <icons.Database :size="13" /> Demo
          </span>

          <button class="btn btn-ghost px-2.5" @click="ui.toggleSound()" :title="ui.soundOn ? 'Matikan suara' : 'Nyalakan suara'">
            <component :is="ui.soundOn ? icons.Volume2 : icons.VolumeX" :size="19" />
          </button>
          <button class="btn btn-ghost px-2.5" @click="ui.toggleTheme()" :title="ui.dark ? 'Mode terang' : 'Mode gelap'">
            <component :is="ui.dark ? icons.Sun : icons.Moon" :size="19" />
          </button>

          <div class="relative">
            <button class="btn btn-ghost px-2.5 relative" @click="toggleNotif">
              <icons.Bell :size="19" />
              <span v-if="notifs.length" class="absolute top-1.5 right-2 h-2 w-2 rounded-full" style="background: var(--danger)"></span>
            </button>
            <transition name="fade">
              <div v-if="notifOpen" class="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] card p-2 z-40">
                <div class="flex items-center justify-between px-2 py-1.5">
                  <span class="font-semibold text-sm">Notifikasi</span>
                  <span v-if="notifs.length" class="chip text-brand-700 dark:text-brand-600" style="background: var(--brand-50)">{{ notifs.length }} baru</span>
                </div>
                <div v-if="notifs.length" class="flex flex-col">
                  <button v-for="(n, i) in notifs" :key="i" class="flex gap-3 items-start text-left rounded-xl p-2.5 hover:bg-surface-2 transition-colors" @click="notifOpen = false; n.to && router.push(n.to)">
                    <span class="grid h-9 w-9 place-items-center rounded-lg shrink-0" :style="{ background: 'color-mix(in oklab,' + n.tone + ' 14%, transparent)', color: n.tone }">
                      <component :is="Icon(n.icon)" :size="16" />
                    </span>
                    <div class="min-w-0 flex-1">
                      <div class="text-[0.83rem] font-medium truncate">{{ n.title }}</div>
                      <div class="text-[0.74rem] text-faint truncate">{{ n.desc }}</div>
                    </div>
                    <span v-if="n.time" class="text-[0.68rem] text-faint shrink-0">{{ n.time }}</span>
                  </button>
                </div>
                <div v-else class="text-center py-6 text-faint text-sm"><icons.BellOff :size="22" class="mx-auto mb-1.5 opacity-60" /> Tidak ada notifikasi</div>
              </div>
            </transition>
          </div>

          <div class="relative">
            <button class="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-surface-2 transition-colors" @click="profileOpen = !profileOpen; sound.play('click')">
              <Avatar :name="auth.user?.name" :size="32" />
              <icons.ChevronDown :size="15" class="text-faint" />
            </button>
            <transition name="fade">
              <div v-if="profileOpen" class="absolute right-0 mt-2 w-52 card p-1.5 z-40">
                <div class="px-3 py-2 border-b border-border mb-1">
                  <div class="text-sm font-semibold truncate">{{ auth.user?.name }}</div>
                  <div class="text-[0.72rem] text-faint truncate">{{ auth.user?.email }}</div>
                </div>
                <button class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-ink" @click="go('/profile')">
                  <icons.User :size="16" /> Biodata Saya
                </button>
                <button class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-surface-2" @click="logout">
                  <icons.LogOut :size="16" /> Keluar
                </button>
              </div>
            </transition>
          </div>
        </div>
      </header>

      <main class="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto">
        <RouterView v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>
