<template>
  <canvas ref="canvasRef" class="galaxy-canvas" aria-hidden="true"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref<HTMLCanvasElement>()

let ctx: CanvasRenderingContext2D | null = null
let animId = 0
let running = false
let stars: Star[] = []
let meteors: Meteor[] = []
let nebulaCanvas: HTMLCanvasElement | null = null
let w = 0
let h = 0
let dpr = 0

interface Star {
  x: number; y: number; r: number
  hue: number; sat: number; light: number
  baseAlpha: number; phase: number; speed: number
}

interface Meteor {
  x: number; y: number; len: number; angle: number; speed: number; alpha: number; life: number; maxLife: number
}

const isMobile = () => window.innerWidth < 768

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function createNebula() {
  if (!nebulaCanvas || w <= 0 || h <= 0 || dpr <= 0) return
  const nctx = nebulaCanvas.getContext('2d')!
  const nw = Math.floor(w * dpr)
  const nh = Math.floor(h * dpr)
  if (nw <= 0 || nh <= 0) return
  nebulaCanvas.width = nw
  nebulaCanvas.height = nh
  nctx.clearRect(0, 0, nw, nh)

  const cx = nw * 0.55
  const cy = nh * 0.45
  const bandW = nw * 0.35
  const bandH = nh * 1.6
  const angle = -0.45

  for (let i = 0; i < 40; i++) {
    const offset = (i / 40 - 0.5) * bandH
    const px = cx + Math.cos(angle) * offset + (seededRandom(i * 17) - 0.5) * bandW * 0.8
    const py = cy + Math.sin(angle) * offset + (seededRandom(i * 31) - 0.5) * bandW * 0.8
    const rx = bandW * (0.15 + seededRandom(i * 43) * 0.35)
    const ry = rx * (0.6 + seededRandom(i * 53) * 0.8)

    const grad = nctx.createRadialGradient(px, py, 0, px, py, Math.max(rx, ry))
    const colorChoice = seededRandom(i * 7)
    if (colorChoice < 0.4) {
      grad.addColorStop(0, 'rgba(100,80,180,0.07)')
      grad.addColorStop(0.5, 'rgba(70,60,150,0.04)')
      grad.addColorStop(1, 'rgba(50,50,120,0)')
    } else if (colorChoice < 0.7) {
      grad.addColorStop(0, 'rgba(60,100,180,0.055)')
      grad.addColorStop(0.5, 'rgba(40,70,140,0.03)')
      grad.addColorStop(1, 'rgba(30,50,100,0)')
    } else if (colorChoice < 0.9) {
      grad.addColorStop(0, 'rgba(200,120,80,0.035)')
      grad.addColorStop(0.5, 'rgba(160,90,60,0.02)')
      grad.addColorStop(1, 'rgba(120,70,40,0)')
    } else {
      grad.addColorStop(0, 'rgba(20,10,40,0.06)')
      grad.addColorStop(0.6, 'rgba(15,8,30,0.03)')
      grad.addColorStop(1, 'rgba(10,5,20,0)')
    }
    nctx.fillStyle = grad
    nctx.fillRect(px - rx, py - ry, rx * 2, ry * 2)
  }

  for (let i = 0; i < 200; i++) {
    const t = seededRandom(i * 101)
    const offset = (t - 0.5) * bandH * 0.85
    const jitterX = (seededRandom(i * 113) - 0.5) * bandW * 0.65
    const sx = cx + Math.cos(angle) * offset + jitterX
    const sy = cy + Math.sin(angle) * offset + (seededRandom(i * 127) - 0.5) * bandW * 0.25
    const sr = 0.3 + seededRandom(i * 139) * 1.2
    nctx.beginPath()
    nctx.arc(sx, sy, sr, 0, Math.PI * 2)
    const sv = seededRandom(i * 151)
    if (sv < 0.5) {
      nctx.fillStyle = `rgba(180,190,255,${0.15 + sv * 0.35})`
    } else if (sv < 0.75) {
      nctx.fillStyle = `rgba(220,210,255,${0.1 + sv * 0.25})`
    } else {
      nctx.fillStyle = `rgba(255,230,200,${0.08 + sv * 0.18})`
    }
    nctx.fill()
  }
}

function createStars() {
  stars = []
  const mobile = isMobile()
  const count = mobile ? 400 : 900

  for (let i = 0; i < count; i++) {
    const sr = seededRandom(i * 311)
    let r: number
    let hue: number
    let sat: number
    let light: number

    if (sr < 0.55) {
      r = 0.3 + seededRandom(i * 317) * 0.7
      hue = 220 + seededRandom(i * 331) * 40
      sat = 10 + seededRandom(i * 337) * 20
      light = 95 + seededRandom(i * 347) * 5
    } else if (sr < 0.82) {
      r = 0.7 + seededRandom(i * 349) * 0.8
      hue = 210 + seededRandom(i * 353) * 50
      sat = 8 + seededRandom(i * 359) * 15
      light = 92 + seededRandom(i * 367) * 8
    } else if (sr < 0.94) {
      r = 1.2 + seededRandom(i * 373) * 1.0
      hue = 45 + seededRandom(i * 379) * 20
      sat = 15 + seededRandom(i * 383) * 20
      light = 90 + seededRandom(i * 389) * 10
    } else {
      r = 1.8 + seededRandom(i * 397) * 1.2
      hue = 15 + seededRandom(i * 401) * 30
      sat = 20 + seededRandom(i * 409) * 30
      light = 88 + seededRandom(i * 419) * 12
    }

    const inBand = sr > 0.3 && sr < 0.7
    let x: number
    let y: number
    if (inBand && !mobile) {
      const bandCx = w * 0.55
      const bandCy = h * 0.45
      const bandAngle = -0.45
      const bandOffset = (seededRandom(i * 421) - 0.5) * h * 1.4
      x = bandCx + Math.cos(bandAngle) * bandOffset + (seededRandom(i * 431) - 0.5) * w * 0.28
      y = bandCy + Math.sin(bandAngle) * bandOffset + (seededRandom(i * 433) - 0.5) * w * 0.12
    } else {
      x = seededRandom(i * 439) * w
      y = seededRandom(i * 443) * h
    }

    stars.push({
      x, y, r,
      hue, sat, light,
      baseAlpha: 0.3 + seededRandom(i * 449) * 0.7,
      phase: seededRandom(i * 457) * Math.PI * 2,
      speed: 0.3 + seededRandom(i * 463) * 1.5
    })
  }
}

function spawnMeteor() {
  if (isMobile()) return
  meteors.push({
    x: Math.random() * w * 0.8 + w * 0.1,
    y: Math.random() * h * 0.3,
    len: 30 + Math.random() * 55,
    angle: Math.PI / 4 + (Math.random() - 0.5) * 0.4,
    speed: 3 + Math.random() * 4,
    alpha: 1,
    life: 0,
    maxLife: 45 + Math.random() * 30
  })
}

function draw() {
  if (!ctx || !canvasRef.value || w <= 0 || h <= 0) return
  const t = performance.now() / 1000

  const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
  bgGrad.addColorStop(0, '#0a0a14')
  bgGrad.addColorStop(0.4, '#0c0e1a')
  bgGrad.addColorStop(0.7, '#0d111a')
  bgGrad.addColorStop(1, '#080810')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, w, h)

  if (nebulaCanvas && nebulaCanvas.width > 0 && nebulaCanvas.height > 0) {
    ctx.drawImage(nebulaCanvas, 0, 0, w, h)
  }

  for (const s of stars) {
    const alpha = s.baseAlpha * (0.4 + 0.6 * Math.sin(t * s.speed + s.phase))
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${s.hue},${s.sat}%,${s.light}%,${alpha})`
    ctx.fill()
    if (s.r > 1.5) {
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${s.hue},${Math.max(s.sat - 10, 0)}%,${Math.min(s.light + 5, 100)}%,${alpha * 0.08})`
      ctx.fill()
    }
  }

  if (!isMobile() && Math.random() < 0.003) {
    spawnMeteor()
  }

  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i]
    m.life++
    m.x += Math.cos(m.angle) * m.speed
    m.y += Math.sin(m.angle) * m.speed
    m.alpha = 1 - m.life / m.maxLife

    if (m.life >= m.maxLife || m.alpha <= 0) {
      meteors.splice(i, 1)
      continue
    }

    const tailX = m.x - Math.cos(m.angle) * m.len
    const tailY = m.y - Math.sin(m.angle) * m.len
    const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y)
    grad.addColorStop(0, 'rgba(255,255,255,0)')
    grad.addColorStop(0.7, `rgba(220,235,255,${m.alpha * 0.5})`)
    grad.addColorStop(1, `rgba(255,255,255,${m.alpha})`)

    ctx.beginPath()
    ctx.moveTo(tailX, tailY)
    ctx.lineTo(m.x, m.y)
    ctx.strokeStyle = grad
    ctx.lineWidth = 1
    ctx.stroke()
  }

  animId = requestAnimationFrame(draw)
}

function resize() {
  const canvas = canvasRef.value
  if (!canvas) return
  dpr = isMobile() ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2)
  w = window.innerWidth
  h = window.innerHeight
  if (w <= 0 || h <= 0 || dpr <= 0) return
  canvas.width = w * dpr
  canvas.height = h * dpr
  ctx = canvas.getContext('2d')!
  if (!nebulaCanvas) {
    nebulaCanvas = document.createElement('canvas')
  }
  createNebula()
  createStars()
}

function start() {
  if (running) return
  running = true
  draw()
}

function stop() {
  running = false
  cancelAnimationFrame(animId)
  animId = 0
}

defineExpose({ start, stop })

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  start()
})

onBeforeUnmount(() => {
  stop()
  window.removeEventListener('resize', resize)
})
</script>

<style scoped>
.galaxy-canvas {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  width: 100%;
  height: 100%;
}
</style>
