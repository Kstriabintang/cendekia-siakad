<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth.js'
import { sound } from '@/lib/sound.js'
import AuroraBackground from '@/components/AuroraBackground.vue'
import { icons } from '@/lib/icons'

const router = useRouter()
const auth = useAuth()
const email = ref('rangga@student.cendekia.ac.id')
const password = ref('demo1234')
const showPass = ref(false)
const busy = ref(false)

const quick = [
  { email: 'rangga@student.cendekia.ac.id', role: 'Mahasiswa', name: 'Rangga Saputra', icon: 'GraduationCap', tone: 'var(--brand-600)' },
  { email: 'bagus@cendekia.ac.id', role: 'Dosen Wali', name: 'Dr. Bagus Prakoso', icon: 'UserCheck', tone: 'var(--info)' },
  { email: 'admin@cendekia.ac.id', role: 'Admin (BAAK)', name: 'Rina Kusuma', icon: 'ShieldCheck', tone: 'var(--gold)' },
]

async function submit() {
  if (busy.value) return
  busy.value = true
  try { await auth.login(email.value); sound.play('success'); router.push('/dashboard') }
  catch (e) { sound.play('error') }
  finally { busy.value = false }
}
function quickLogin(q) { email.value = q.email; password.value = 'demo1234'; submit() }
</script>

<template>
  <div class="min-h-screen grid lg:grid-cols-2 bg-surface text-ink">
    <!-- Brand panel -->
    <div class="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden text-white" style="background: linear-gradient(150deg, #073c37, #0b6d63 55%, #0f9c8b)">
      <AuroraBackground class="!absolute inset-0" :dark="true" style="opacity:.5" />
      <div class="relative z-10 flex items-center gap-3">
        <div class="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
          <svg viewBox="0 0 32 32" class="h-6 w-6"><path d="M16 6 L27 11 L16 16 L5 11 Z" fill="white"/><path d="M9 14 L9 20 Q16 24 23 20 L23 14" fill="none" stroke="white" stroke-width="1.8"/></svg>
        </div>
        <div class="leading-tight">
          <div class="text-xl font-bold" style="font-family: var(--font-serif)">Cendekia</div>
          <div class="text-[0.7rem] tracking-[0.18em] uppercase text-white/70 font-semibold">Sistem Informasi Akademik</div>
        </div>
      </div>

      <div class="relative z-10 max-w-md">
        <h1 class="text-4xl font-bold leading-tight mb-4" style="font-family: var(--font-serif)">Satu portal untuk seluruh perjalanan akademik Anda.</h1>
        <p class="text-white/80 text-[0.98rem] leading-relaxed">KRS, jadwal, nilai, transkrip, presensi, hingga keuangan UKT — terintegrasi, real-time, dan mudah diakses kapan saja.</p>
        <div class="flex flex-wrap gap-2 mt-7">
          <span v-for="t in ['KRS Online','KHS & Transkrip','Perwalian Digital','Keuangan UKT']" :key="t" class="chip bg-white/12 text-white/90 backdrop-blur">{{ t }}</span>
        </div>
      </div>

      <div class="relative z-10 flex items-center gap-6 text-white/70 text-sm">
        <div><span class="num text-2xl font-bold text-white" style="font-family: var(--font-serif)">4.2k</span><br/>Mahasiswa aktif</div>
        <div class="h-8 w-px bg-white/20"></div>
        <div><span class="num text-2xl font-bold text-white" style="font-family: var(--font-serif)">Unggul</span><br/>Akreditasi Prodi</div>
        <div class="h-8 w-px bg-white/20"></div>
        <div><span class="num text-2xl font-bold text-white" style="font-family: var(--font-serif)">99.9%</span><br/>Ketersediaan</div>
      </div>
    </div>

    <!-- Form -->
    <div class="flex items-center justify-center p-6 sm:p-10">
      <div class="w-full max-w-sm">
        <div class="lg:hidden flex items-center gap-2.5 mb-8">
          <div class="grid h-10 w-10 place-items-center rounded-xl" style="background: var(--brand-600)">
            <svg viewBox="0 0 32 32" class="h-5 w-5"><path d="M16 6 L27 11 L16 16 L5 11 Z" fill="white"/></svg>
          </div>
          <div><div class="font-bold" style="font-family: var(--font-serif)">Cendekia SIAKAD</div></div>
        </div>

        <p class="label-eyebrow mb-2">Portal Akademik</p>
        <h2 class="text-2xl font-bold mb-1.5" style="font-family: var(--font-serif)">Masuk ke akun Anda</h2>
        <p class="text-muted text-sm mb-6">Gunakan email kampus (NIM/NIDN). <span class="text-gold font-medium">Mode demo</span> — sandi apa pun diterima.</p>

        <form @submit.prevent="submit" class="flex flex-col gap-4">
          <label class="block">
            <span class="text-[0.8rem] font-medium text-muted mb-1.5 block">Email Kampus</span>
            <div class="relative">
              <icons.Mail :size="17" class="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input v-model="email" type="email" class="input pl-10" placeholder="nama@cendekia.ac.id" required />
            </div>
          </label>
          <label class="block">
            <span class="text-[0.8rem] font-medium text-muted mb-1.5 block">Kata Sandi</span>
            <div class="relative">
              <icons.Lock :size="17" class="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input v-model="password" :type="showPass ? 'text' : 'password'" class="input pl-10 pr-10" placeholder="••••••••" />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink" @click="showPass = !showPass">
                <component :is="showPass ? icons.EyeOff : icons.Eye" :size="17" />
              </button>
            </div>
          </label>

          <p v-if="auth.error" class="text-danger text-sm flex items-center gap-1.5"><icons.AlertCircle :size="15" /> {{ auth.error }}</p>

          <button type="submit" class="btn btn-primary w-full py-3" :disabled="busy">
            <icons.Loader2 v-if="busy" :size="18" class="animate-spin" />
            <template v-else><icons.LogIn :size="18" /> Masuk</template>
          </button>
        </form>

        <div class="flex items-center gap-3 my-6">
          <div class="h-px flex-1 bg-border"></div>
          <span class="text-[0.72rem] text-faint uppercase tracking-wider font-semibold">Masuk cepat (demo)</span>
          <div class="h-px flex-1 bg-border"></div>
        </div>

        <div class="flex flex-col gap-2">
          <button v-for="q in quick" :key="q.email" @click="quickLogin(q)"
            class="flex items-center gap-3 rounded-xl border border-border-strong bg-card p-2.5 text-left hover:border-brand-400 hover:bg-surface-2 transition-colors">
            <span class="grid h-9 w-9 place-items-center rounded-lg shrink-0" :style="{ background: 'color-mix(in oklab,' + q.tone + ' 14%, transparent)', color: q.tone }">
              <component :is="icons[q.icon]" :size="17" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="text-[0.85rem] font-semibold truncate">{{ q.name }}</div>
              <div class="text-[0.72rem] text-faint truncate">{{ q.email }}</div>
            </div>
            <span class="chip text-muted bg-surface-2">{{ q.role }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
