<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  opacity: { type: Number, default: 1 },
  density: { type: Number, default: 1 },
  atoms: { type: Number, default: 3 },
  neurons: { type: Number, default: 14 },
  primary: { type: Array, default: () => [106, 99, 232] },  // indigo lines
  accent: { type: Array, default: () => [56, 189, 214] },   // electric cyan
  interactive: { type: Boolean, default: true },
})

const canvas = ref(null)
let ctx, raf, ro, tick = 0
let W = 0, H = 0, DPR = 1
let dust = [], neurons = [], edges = [], pulses = [], atomList = []
const mouse = { x: -9999, y: -9999 }
const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, a) * props.opacity})`
const rnd = (a, b) => a + Math.random() * (b - a)

function build() {
  const el = canvas.value
  const rect = el.parentElement.getBoundingClientRect()
  W = rect.width; H = rect.height
  DPR = Math.min(window.devicePixelRatio || 1, 2)
  el.width = W * DPR; el.height = H * DPR
  el.style.width = W + 'px'; el.style.height = H + 'px'
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

  // molecular dust
  const dc = Math.round((W * H) / 20000 * props.density)
  dust = Array.from({ length: dc }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: rnd(-0.18, 0.18), vy: rnd(-0.18, 0.18), r: rnd(0.6, 1.7),
  }))

  // neural network (brain-like): nodes with base + drift
  const nc = Math.round(props.neurons * props.density)
  neurons = Array.from({ length: nc }, () => {
    const bx = rnd(0.05, 0.95) * W, by = rnd(0.05, 0.95) * H
    return { bx, by, x: bx, y: by, ph: Math.random() * Math.PI * 2, amp: rnd(6, 20), sp: rnd(0.004, 0.011), r: rnd(1.6, 3.4), glow: Math.random() * Math.PI * 2 }
  })
  edges = []
  const maxD = Math.min(W, H) * 0.32
  for (let i = 0; i < neurons.length; i++)
    for (let j = i + 1; j < neurons.length; j++) {
      const d = Math.hypot(neurons[i].bx - neurons[j].bx, neurons[i].by - neurons[j].by)
      if (d < maxD) edges.push({ a: i, b: j, d })
    }
  pulses = []

  // atoms
  atomList = Array.from({ length: props.atoms }, () => {
    const cx = rnd(0.12, 0.88) * W, cy = rnd(0.15, 0.85) * H
    const scale = rnd(44, 90)
    const orbits = Array.from({ length: 3 }, (_, k) => ({
      a: scale * rnd(0.72, 1.12), b: scale * rnd(0.26, 0.48),
      tilt: (Math.PI / 3) * k + rnd(-0.3, 0.3),
      ang: Math.random() * Math.PI * 2, spd: rnd(0.006, 0.013) * (Math.random() > 0.5 ? 1 : -1),
    }))
    return { cx, cy, scale, orbits, pulse: Math.random() * Math.PI * 2 }
  })
}

function spawnPulse() {
  if (!edges.length || pulses.length > 18) return
  const e = edges[(Math.random() * edges.length) | 0]
  pulses.push({ e, t: 0, sp: rnd(0.006, 0.016) })
}

function drawAtom(A) {
  A.pulse += 0.02
  const g = 1 + Math.sin(A.pulse) * 0.12
  const grad = ctx.createRadialGradient(A.cx, A.cy, 0, A.cx, A.cy, A.scale * 0.55 * g)
  grad.addColorStop(0, rgba(props.accent, 0.42))
  grad.addColorStop(0.4, rgba(props.primary, 0.16))
  grad.addColorStop(1, rgba(props.primary, 0))
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(A.cx, A.cy, A.scale * 0.55 * g, 0, 6.2832); ctx.fill()
  ctx.fillStyle = rgba(props.accent, 0.8)
  ctx.beginPath(); ctx.arc(A.cx, A.cy, 2.4, 0, 6.2832); ctx.fill()
  for (const o of A.orbits) {
    if (!reduce) o.ang += o.spd
    ctx.save(); ctx.translate(A.cx, A.cy); ctx.rotate(o.tilt)
    ctx.strokeStyle = rgba(props.primary, 0.14); ctx.lineWidth = 1
    ctx.beginPath(); ctx.ellipse(0, 0, o.a, o.b, 0, 0, 6.2832); ctx.stroke()
    const ex = Math.cos(o.ang) * o.a, ey = Math.sin(o.ang) * o.b
    const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 7)
    eg.addColorStop(0, rgba(props.accent, 0.9)); eg.addColorStop(1, rgba(props.accent, 0))
    ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(ex, ey, 7, 0, 6.2832); ctx.fill()
    ctx.fillStyle = rgba(props.accent, 1); ctx.beginPath(); ctx.arc(ex, ey, 1.8, 0, 6.2832); ctx.fill()
    ctx.restore()
  }
}

function frame() {
  tick++
  ctx.clearRect(0, 0, W, H)

  // molecular dust + short links
  for (const p of dust) {
    if (!reduce) {
      p.x += p.vx; p.y += p.vy
      if (p.x < 0 || p.x > W) p.vx *= -1
      if (p.y < 0 || p.y > H) p.vy *= -1
      if (props.interactive) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy)
        if (d < 130) { p.x += dx / d * 0.5; p.y += dy / d * 0.5 }
      }
    }
    ctx.fillStyle = rgba(props.primary, 0.4)
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill()
  }
  for (let i = 0; i < dust.length; i++)
    for (let j = i + 1; j < dust.length; j++) {
      const a = dust[i], b = dust[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy
      if (d2 < 10000) {
        ctx.strokeStyle = rgba(props.primary, (1 - d2 / 10000) * 0.22)
        ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
      }
    }

  // neural nodes drift
  for (const n of neurons) {
    if (!reduce) { n.ph += n.sp; n.glow += 0.03 }
    n.x = n.bx + Math.cos(n.ph) * n.amp
    n.y = n.by + Math.sin(n.ph * 1.3) * n.amp
  }
  // neural edges (brain lines)
  for (const e of edges) {
    const a = neurons[e.a], b = neurons[e.b]
    ctx.strokeStyle = rgba(props.primary, 0.2 * (1 - e.d / (Math.min(W, H) * 0.32)))
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
  }
  // neural nodes glow
  for (const n of neurons) {
    const pg = 0.5 + Math.sin(n.glow) * 0.5
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 9)
    g.addColorStop(0, rgba(props.accent, 0.5 * pg + 0.2))
    g.addColorStop(1, rgba(props.accent, 0))
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, 9, 0, 6.2832); ctx.fill()
    ctx.fillStyle = rgba(props.primary, 0.75); ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.2832); ctx.fill()
  }
  // traveling synapse pulses
  if (!reduce && tick % 10 === 0) spawnPulse()
  for (let i = pulses.length - 1; i >= 0; i--) {
    const P = pulses[i]; P.t += P.sp
    if (P.t >= 1) { pulses.splice(i, 1); continue }
    const a = neurons[P.e.a], b = neurons[P.e.b]
    const x = a.x + (b.x - a.x) * P.t, y = a.y + (b.y - a.y) * P.t
    const g = ctx.createRadialGradient(x, y, 0, x, y, 5)
    g.addColorStop(0, rgba(props.accent, 0.95)); g.addColorStop(1, rgba(props.accent, 0))
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.2832); ctx.fill()
  }

  for (const A of atomList) drawAtom(A)

  if (!reduce) raf = requestAnimationFrame(frame)
}

function onMove(e) { mouse.x = e.clientX; mouse.y = e.clientY }
function onLeave() { mouse.x = -9999; mouse.y = -9999 }

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  build(); frame()
  ro = new ResizeObserver(() => { build(); if (reduce) frame() })
  ro.observe(canvas.value.parentElement)
  if (props.interactive && !reduce) { window.addEventListener('mousemove', onMove); window.addEventListener('mouseleave', onLeave) }
})
watch(() => [props.primary, props.accent], () => { if (reduce) frame() })
onBeforeUnmount(() => {
  cancelAnimationFrame(raf); ro?.disconnect()
  window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseleave', onLeave)
})
</script>

<template>
  <canvas ref="canvas" class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true"></canvas>
</template>
