import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api.js'

const STORAGE = 'siakad-user'

export const useAuth = defineStore('auth', () => {
  const user = ref(loadUser())
  const loading = ref(false)
  const error = ref('')

  function loadUser() {
    try { const r = localStorage.getItem(STORAGE); return r ? JSON.parse(r) : null } catch (e) { return null }
  }

  const isAuthed = computed(() => !!user.value)
  const role = computed(() => user.value?.role || null)
  const initials = computed(() => (user.value?.name || '?').split(' ').slice(0, 2).map((s) => s[0]).join('').toUpperCase())

  async function login(email) {
    loading.value = true; error.value = ''
    try {
      const u = await api.login(email)
      user.value = u
      localStorage.setItem(STORAGE, JSON.stringify(u))
      return u
    } catch (e) {
      error.value = e.message || 'Gagal masuk'
      throw e
    } finally { loading.value = false }
  }

  function loginAs(u) { user.value = u; localStorage.setItem(STORAGE, JSON.stringify(u)) }
  function logout() { user.value = null; localStorage.removeItem(STORAGE) }

  return { user, loading, error, isAuthed, role, initials, login, loginAs, logout }
})
