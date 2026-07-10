import { reactive } from 'vue'
import { sound } from './sound.js'

export const toasts = reactive([])
let seq = 0

export function toast(message, opts = {}) {
  const t = { id: ++seq, message, type: opts.type || 'info', title: opts.title || null }
  toasts.push(t)
  if (opts.type === 'success') sound.play('success')
  else if (opts.type === 'error') sound.play('error')
  else sound.play('notify')
  setTimeout(() => dismiss(t.id), opts.duration || 3200)
  return t.id
}
export function dismiss(id) {
  const i = toasts.findIndex((t) => t.id === id)
  if (i >= 0) toasts.splice(i, 1)
}
