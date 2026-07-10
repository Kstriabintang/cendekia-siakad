import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/stores/auth.js'

const AppShell = () => import('@/layouts/AppShell.vue')

const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/Login.vue'), meta: { public: true } },
  {
    path: '/', component: AppShell,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: 'Dashboard' } },
      { path: 'krs', component: () => import('@/views/Krs.vue'), meta: { title: 'Kartu Rencana Studi (KRS)' } },
      { path: 'schedule', component: () => import('@/views/Schedule.vue'), meta: { title: 'Jadwal Kuliah' } },
      { path: 'curriculum', component: () => import('@/views/Curriculum.vue'), meta: { title: 'Kurikulum & Mata Kuliah' } },
      { path: 'grades', component: () => import('@/views/Grades.vue'), meta: { title: 'Nilai & KHS' } },
      { path: 'transcript', component: () => import('@/views/Transcript.vue'), meta: { title: 'Transkrip Akademik' } },
      { path: 'attendance', component: () => import('@/views/Attendance.vue'), meta: { title: 'Presensi Kuliah' } },
      { path: 'payments', component: () => import('@/views/Payments.vue'), meta: { title: 'Keuangan & UKT' } },
      { path: 'calendar', component: () => import('@/views/Calendar.vue'), meta: { title: 'Kalender Akademik' } },
      { path: 'perwalian', component: () => import('@/views/Advising.vue'), meta: { title: 'Perwalian Akademik' } },
      { path: 'announcements', component: () => import('@/views/Announcements.vue'), meta: { title: 'Pengumuman' } },
      { path: 'management', component: () => import('@/views/Management.vue'), meta: { title: 'Manajemen Data' } },
      { path: 'profile', component: () => import('@/views/Profile.vue'), meta: { title: 'Biodata & Profil' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({ history: createWebHistory(), routes, scrollBehavior: () => ({ top: 0 }) })

router.beforeEach((to) => {
  const auth = useAuth()
  if (!to.meta.public && !auth.isAuthed) return { path: '/login' }
  if (to.path === '/login' && auth.isAuthed) return { path: '/dashboard' }
})

export default router
