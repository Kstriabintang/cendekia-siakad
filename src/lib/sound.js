// Lightweight sound engine — all tones are synthesized with the Web Audio API,
// so there are zero audio files to bundle or fetch. Sounds are short, soft, and
// tuned to feel "scientific / crisp". Respects a global mute flag + reduced-motion.

let ctx = null
let master = null
let enabled = load()
const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function load() {
  try { return localStorage.getItem('siakad-sound') !== 'off' } catch (e) { return true }
}
function ensure() {
  if (ctx) return ctx
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  } catch (e) { ctx = null }
  return ctx
}

// One shaped oscillator note
function note({ freq = 440, type = 'sine', start = 0, dur = 0.14, gain = 0.14, glideTo = null }) {
  if (!ctx) return
  const t0 = ctx.currentTime + start
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g); g.connect(master)
  osc.start(t0); osc.stop(t0 + dur + 0.02)
}

const recipes = {
  click: () => note({ freq: 520, type: 'triangle', dur: 0.05, gain: 0.05 }),
  tick: () => note({ freq: 720, type: 'sine', dur: 0.04, gain: 0.045 }),
  toggle: () => { note({ freq: 400, type: 'sine', dur: 0.07, gain: 0.06 }); note({ freq: 660, type: 'sine', start: 0.05, dur: 0.08, gain: 0.06 }) },
  notify: () => { // bell-ish two tone
    note({ freq: 880, type: 'sine', dur: 0.18, gain: 0.09 })
    note({ freq: 1318.5, type: 'sine', start: 0.02, dur: 0.22, gain: 0.05 })
  },
  success: () => { // C-E-G-C arpeggio
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note({ freq: f, type: 'sine', start: i * 0.08, dur: 0.22, gain: 0.1 }))
  },
  error: () => { note({ freq: 300, type: 'square', dur: 0.16, gain: 0.06, glideTo: 150 }) },
  login: () => { ;[440, 587.33, 880].forEach((f, i) => note({ freq: f, type: 'triangle', start: i * 0.06, dur: 0.2, gain: 0.08 })) },
  send: () => { note({ freq: 300, type: 'sine', dur: 0.1, gain: 0.07, glideTo: 900 }) },
}

export const sound = {
  get enabled() { return enabled },
  setEnabled(v) {
    enabled = v
    try { localStorage.setItem('siakad-sound', v ? 'on' : 'off') } catch (e) {}
    if (v) { ensure(); if (ctx?.state === 'suspended') ctx.resume(); this.play('toggle') }
  },
  play(name) {
    if (!enabled || reduce) return
    if (!ensure()) return
    if (ctx.state === 'suspended') ctx.resume()
    ;(recipes[name] || recipes.click)()
  },
}
