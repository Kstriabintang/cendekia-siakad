import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sound } from '@/lib/sound.js'

export const useUI = defineStore('ui', () => {
  const dark = ref(document.documentElement.classList.contains('dark'))
  const sidebarCollapsed = ref(localStorage.getItem('siakad-sidebar') === '1')
  const soundOn = ref(sound.enabled)

  function toggleTheme() {
    dark.value = !dark.value
    document.documentElement.classList.toggle('dark', dark.value)
    localStorage.setItem('siakad-theme', dark.value ? 'dark' : 'light')
    sound.play('toggle')
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('siakad-sidebar', sidebarCollapsed.value ? '1' : '0')
    sound.play('click')
  }

  function toggleSound() {
    soundOn.value = !soundOn.value
    sound.setEnabled(soundOn.value)
  }

  return { dark, sidebarCollapsed, soundOn, toggleTheme, toggleSidebar, toggleSound }
})
