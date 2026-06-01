<template>
  <div ref="containerRef" class="sphere-carousel">
    <canvas ref="canvasRef" class="sphere-canvas" />
    <div class="sphere-vignette" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, onDeactivated, watch } from 'vue'
import * as THREE from 'three'

interface Props {
  images?: string[]
  bgColor?: string
  sphereRadius?: number
  cardW?: number
  cardH?: number
  gridGap?: number
  depthRange?: number
  autoRotateSpeed?: number
  sphereSpacing?: number
  sphereCount?: number
  dragSensitivity?: number
  dragSmoothing?: number
  friction?: number
  fadeInDuration?: number
  camZ?: number
  initRotX?: number
  fov?: number
  facingMultiplier?: number
  facingOffset?: number
  overlayOpacity?: number
  breathMinSpeed?: number
  breathSpeedRange?: number
  breathMinAmp?: number
  breathAmpRange?: number
  cardCornerRadius?: number
  maxRotX?: number
  vignetteRadius?: number
  vignetteSoftness?: number
  vignetteIntensity?: number
  grainIntensity?: number
  distFadeMult?: number
  backMinOutside?: number
  backMinInside?: number
  mouseParallax?: number
}

const props = withDefaults(defineProps<Props>(), {
  images: () => [],
  bgColor: '#121212',
  sphereRadius: 30,
  cardW: 3.6,
  cardH: 2.5,
  gridGap: 2.2,
  depthRange: 4,
  autoRotateSpeed: 0.0001,
  sphereSpacing: 120,
  sphereCount: 5,
  dragSensitivity: 0.003,
  dragSmoothing: 0.3,
  friction: 0.95,
  fadeInDuration: 4,
  camZ: 45.7,
  initRotX: 0.078,
  fov: 50,
  facingMultiplier: 0.5,
  facingOffset: 0.4,
  overlayOpacity: 0.4,
  breathMinSpeed: 0.3,
  breathSpeedRange: 0.3,
  breathMinAmp: 0.05,
  breathAmpRange: 0.08,
  cardCornerRadius: 24,
  maxRotX: 0.6,
  vignetteRadius: 0,
  vignetteSoftness: 0.46,
  vignetteIntensity: 1.0,
  grainIntensity: 0.13,
  distFadeMult: 1.3,
  backMinOutside: 0,
  backMinInside: 0.55,
  mouseParallax: 0
})

const containerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()

function prng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let rt: THREE.WebGLRenderTarget
let vignetteScene: THREE.Scene
let vignetteCam: THREE.OrthographicCamera
let vignetteMat: THREE.ShaderMaterial
let startTime = 0
let pausedElapsed = 0
let animFrameId = 0
let paused = false

const spheres: { group: THREE.Group; cards: THREE.Mesh[] }[] = []
const textures: THREE.Texture[] = []
const texCache = new Map<string, THREE.Texture>()
let placeholderTex: THREE.CanvasTexture

let drag = false
let dx = 0
let dy = 0
let dvx = 0
let dvy = 0
let tvx = 0
let tvy = 0
let mouseNormX = 0
let mouseNormY = 0
let smoothMX = 0
let smoothMY = 0

const overlayVert = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const overlayFrag = `uniform sampler2D map; uniform vec3 u_overlayColor; uniform float u_overlayOpacity; varying vec2 vUv;
void main() { vec4 tex = texture2D(map, vUv); gl_FragColor = vec4(tex.rgb * (1.0 - u_overlayOpacity) + u_overlayColor * u_overlayOpacity, tex.a); }`

const vignetteVert = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`
const vignetteFrag = `
  uniform sampler2D u_scene;
  uniform vec3 u_bgColor;
  uniform float u_radius;
  uniform float u_softness;
  uniform float u_intensity;
  uniform float u_grainIntensity;
  uniform float u_grainScale;
  uniform float u_time;
  uniform vec2 u_resolution;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float dither(vec2 co) { return (fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0; }
  void main() {
    vec3 col = texture2D(u_scene, vUv).rgb;
    float grain = (hash(floor(gl_FragCoord.xy / u_grainScale) + u_time) - 0.5) * u_grainIntensity;
    col *= (1.0 + grain);
    float dist = abs(vUv.y - 0.5);
    float vig = smoothstep(u_radius, u_radius + u_softness, dist) * u_intensity;
    col = mix(col, u_bgColor, vig) + dither(gl_FragCoord.xy);
    gl_FragColor = vec4(col, 1.0);
  }`

function makeTexture(img: HTMLImageElement | null): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 604
  c.height = 420
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, 604, 420)
  ctx.beginPath()
  ctx.roundRect(0, 0, 604, 420, props.cardCornerRadius)
  ctx.closePath()
  if (img) {
    ctx.clip()
    const cw = 604, ch = 420
    const iw = img.naturalWidth, ih = img.naturalHeight
    const scale = Math.max(cw / iw, ch / ih)
    const sw = iw * scale, sh = ih * scale
    const sx = (cw - sw) / 2, sy = (ch - sh) / 2
    ctx.drawImage(img, sx, sy, sw, sh)
  } else {
    ctx.fillStyle = '#2a2a2a'
    ctx.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.LinearSRGBColorSpace
  if (img) t.anisotropy = renderer.capabilities.getMaxAnisotropy()
  return t
}

function loadImages(urls: string[]) {
  const oldLen = textures.length
  if (urls.length > oldLen) {
    for (let i = oldLen; i < urls.length; i++) textures.push(placeholderTex)
  } else if (urls.length < oldLen) {
    textures.length = urls.length
  }
  urls.forEach((url, i) => {
    if (texCache.has(url)) {
      if (textures[i] !== texCache.get(url)!) textures[i] = texCache.get(url)!
    } else {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const tex = makeTexture(img)
        texCache.set(url, tex)
        textures[i] = tex
      }
      img.src = url
    }
  })
}

function buildSpheres() {
  if (textures.length === 0) return
  const rand = prng(42)
  const R = props.sphereRadius
  const geo = new THREE.PlaneGeometry(props.cardW, props.cardH)
  const angH = (props.cardH * props.gridGap) / R
  const rows = Math.floor(Math.PI / angH)
  const startPhi = (Math.PI - (rows - 1) * angH) / 2
  const overlayColor = new THREE.Color(props.bgColor)
  let gIdx = 0

  const makeSphere = () => {
    const g = new THREE.Group()
    const cards: THREE.Mesh[] = []
    for (let r = 0; r < rows; r++) {
      const phi = startPhi + r * angH
      const sp = Math.sin(phi)
      const cp = Math.cos(phi)
      const cols = Math.max(1, Math.floor((2 * Math.PI * sp * R) / (props.cardW * props.gridGap)))
      const aw = (2 * Math.PI) / cols
      const off = r % 2 ? aw * 0.5 : 0
      for (let c = 0; c < cols; c++) {
        const th = c * aw + off
        const sv = new THREE.Vector3(R * sp * Math.cos(th), R * cp, R * sp * Math.sin(th))
        const pos = sv.clone().addScaledVector(sv.clone().normalize(), (rand() - 0.5) * props.depthRange)
        const ti = gIdx++ % textures.length
        const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
          uniforms: {
            map: { value: textures[ti] },
            u_overlayColor: { value: overlayColor },
            u_overlayOpacity: { value: 0.0 }
          },
          vertexShader: overlayVert,
          fragmentShader: overlayFrag,
          transparent: true,
          side: THREE.DoubleSide
        }))
        m.position.copy(pos)
        m.userData = {
          ti,
          bp: pos.clone(),
          ph: rand() * Math.PI * 2,
          bs: props.breathMinSpeed + rand() * props.breathSpeedRange,
          ba: props.breathMinAmp + rand() * props.breathAmpRange
        }
        cards.push(m)
        g.add(m)
      }
    }
    g.userData = {
      rotY: Math.random() * Math.PI * 2,
      rotX: props.initRotX,
      baseZ: 0
    }
    return { group: g, cards }
  }

  spheres.forEach(s => scene.remove(s.group))
  spheres.length = 0

  for (let i = 0; i < props.sphereCount; i++) {
    const s = makeSphere()
    s.group.userData.baseZ = -i * props.sphereSpacing
    s.group.position.z = s.group.userData.baseZ
    scene.add(s.group)
    spheres.push(s)
  }
}

function updateCam() {
  camera.fov = props.fov
  camera.aspect = containerRef.value!.clientWidth / containerRef.value!.clientHeight
  camera.updateProjectionMatrix()
  camera.position.set(0, 0, props.camZ)
  camera.lookAt(0, 0, props.camZ - 100)
}

function init() {
  const el = containerRef.value!
  const canvas = canvasRef.value!

  THREE.ColorManagement.enabled = false

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setSize(el.clientWidth, el.clientHeight)
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace

  const pr = renderer.getPixelRatio()
  rt = new THREE.WebGLRenderTarget(el.clientWidth * pr, el.clientHeight * pr)

  vignetteMat = new THREE.ShaderMaterial({
    uniforms: {
      u_scene: { value: rt.texture },
      u_bgColor: { value: new THREE.Color(props.bgColor) },
      u_radius: { value: props.vignetteRadius },
      u_softness: { value: props.vignetteSoftness },
      u_intensity: { value: props.vignetteIntensity },
      u_resolution: { value: new THREE.Vector2(el.clientWidth, el.clientHeight) },
      u_grainIntensity: { value: props.grainIntensity },
      u_grainScale: { value: 1 },
      u_time: { value: 0 }
    },
    vertexShader: vignetteVert,
    fragmentShader: vignetteFrag,
    depthTest: false,
    depthWrite: false
  })
  const vignetteQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), vignetteMat)
  vignetteScene = new THREE.Scene()
  vignetteScene.add(vignetteQuad)
  vignetteCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  scene = new THREE.Scene()
  scene.background = new THREE.Color(props.bgColor)
  camera = new THREE.PerspectiveCamera(props.fov, el.clientWidth / el.clientHeight, 0.1, 500)
  updateCam()

  placeholderTex = makeTexture(null)
  textures.length = 0

  if (props.images.length > 0) {
    loadImages(props.images)
  } else {
    for (let i = 0; i < 50; i++) textures.push(placeholderTex)
  }

  buildSpheres()

  startTime = performance.now() / 1000
  animate()
}

function animate() {
  animFrameId = requestAnimationFrame(animate)
  if (paused) return

  const el = containerRef.value!
  if (!el) return

  const t = performance.now() / 1000 - startTime
  const fade = Math.min(t / props.fadeInDuration, 1)

  ;(scene.background as THREE.Color).set(props.bgColor)
  const overlayColor = new THREE.Color(props.bgColor)

  if (drag) {
    dvx += (tvx - dvx) * props.dragSmoothing
    dvy += (tvy - dvy) * props.dragSmoothing
    tvx = 0
    tvy = 0
  } else {
    dvx *= props.friction
    dvy *= props.friction
  }

  const ml = 1 - Math.exp(-0.016 * 5)
  smoothMX += (mouseNormX - smoothMX) * ml
  smoothMY += (mouseNormY - smoothMY) * ml

  const total = props.sphereCount * props.sphereSpacing
  const half = total / 2

  spheres.forEach(({ group: g, cards }) => {
    const u = g.userData as { rotY: number; rotX: number; baseZ: number }
    let rz = u.baseZ - props.camZ
    while (rz > half) { u.baseZ -= total; rz -= total }
    while (rz < -half) { u.baseZ += total; rz += total }
    g.position.z = u.baseZ

    u.rotY += dvx + props.autoRotateSpeed
    u.rotX = drag
      ? Math.max(-props.maxRotX, Math.min(props.maxRotX, u.rotX + dvy))
      : u.rotX + 0.005 * 0.01
    g.rotation.y = u.rotY + smoothMX * props.mouseParallax
    g.rotation.x = u.rotX + smoothMY * props.mouseParallax * 0.5

    const zd = Math.abs(g.position.z - props.camZ)
    const ins = 1 - Math.min(zd / props.sphereRadius, 1)
    const minB = props.backMinOutside + (props.backMinInside - props.backMinOutside) * ins
    const fd = Math.max(0, zd - props.sphereRadius * 1.8)
    const dl = Math.max(0, 1 - fd / (props.sphereSpacing * props.distFadeMult))
    const db = Math.pow(dl, 5)

    cards.forEach((card) => {
      const d = card.userData as { ti: number; bp: THREE.Vector3; ph: number; bs: number; ba: number }
      const mat = card.material as THREE.ShaderMaterial
      if (textures[d.ti] && mat.uniforms.map.value !== textures[d.ti]) {
        mat.uniforms.map.value = textures[d.ti]
      }
      const dir = d.bp.clone().normalize()
      card.position.copy(d.bp).addScaledVector(dir, Math.sin(t * d.bs + d.ph) * d.ba)
      card.quaternion.copy(g.quaternion).invert().multiply(camera.quaternion)
      const wp = card.position.clone()
      g.localToWorld(wp)
      const tc = camera.position.clone().sub(wp).normalize()
      const cn = d.bp.clone().normalize()
      cn.applyQuaternion(g.quaternion)
      const fb = Math.max(minB, Math.min(1, tc.dot(cn) * props.facingMultiplier + props.facingOffset))
      const br = fb * db * fade
      mat.uniforms.u_overlayColor.value = overlayColor
      mat.uniforms.u_overlayOpacity.value = props.overlayOpacity + (1 - br) * (1 - props.overlayOpacity)
    })
  })

  vignetteMat.uniforms.u_bgColor.value.set(props.bgColor)
  vignetteMat.uniforms.u_radius.value = props.vignetteRadius
  vignetteMat.uniforms.u_softness.value = props.vignetteSoftness
  vignetteMat.uniforms.u_intensity.value = props.vignetteIntensity
  vignetteMat.uniforms.u_grainIntensity.value = props.grainIntensity
  vignetteMat.uniforms.u_time.value = t

  renderer.setRenderTarget(rt)
  renderer.render(scene, camera)

  vignetteMat.uniforms.u_scene.value = rt.texture
  renderer.setRenderTarget(null)
  renderer.render(vignetteScene, vignetteCam)
}

function onMouseDown(e: MouseEvent) {
  drag = true
  dx = e.clientX
  dy = e.clientY
}
function onMouseMove(e: MouseEvent) {
  if (!drag) return
  tvx = -(e.clientX - dx) * props.dragSensitivity
  tvy = -(e.clientY - dy) * props.dragSensitivity
  dx = e.clientX
  dy = e.clientY
  mouseNormX = (e.clientX / window.innerWidth - 0.5) * 2
  mouseNormY = (e.clientY / window.innerHeight - 0.5) * 2
}
function onMouseUp() { drag = false }

function onTouchStart(e: TouchEvent) {
  drag = true
  dx = e.touches[0].clientX
  dy = e.touches[0].clientY
}
function onTouchMove(e: TouchEvent) {
  if (!drag) return
  tvx = -(e.touches[0].clientX - dx) * props.dragSensitivity
  dx = e.touches[0].clientX
  dy = e.touches[0].clientY
}
function onTouchEnd() { drag = false }

function onResize() {
  if (!containerRef.value || !renderer) return
  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight
  const p = renderer.getPixelRatio()
  renderer.setSize(w, h)
  rt.setSize(w * p, h * p)
  vignetteMat.uniforms.u_resolution.value.set(w, h)
  updateCam()
}

function onVisibilityChange() {
  if (document.hidden) {
    paused = true
    pausedElapsed = performance.now() / 1000 - startTime
  } else {
    paused = false
    startTime = performance.now() / 1000 - pausedElapsed
  }
}

watch(() => props.images, (urls, oldUrls) => {
  if (urls.length > 0 && renderer) {
    if (!oldUrls || urls.length !== oldUrls.length || urls.some((u, i) => u !== oldUrls[i])) {
      loadImages(urls)
    }
  }
})

onMounted(() => {
  init()

  const el = containerRef.value!
  el.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  el.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('touchend', onTouchEnd, { passive: true })
  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onDeactivated(() => {
  cancelAnimationFrame(animFrameId)
  paused = true
  pausedElapsed = performance.now() / 1000 - startTime
})

onActivated(() => {
  if (renderer && paused) {
    paused = false
    startTime = performance.now() / 1000 - pausedElapsed
    animate()
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animFrameId)

  const el = containerRef.value
  if (el) {
    el.removeEventListener('mousedown', onMouseDown)
  }
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  if (el) {
    el.removeEventListener('touchstart', onTouchStart)
  }
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('visibilitychange', onVisibilityChange)

  if (renderer) {
    renderer.dispose()
  }
  textures.forEach(t => t.dispose())
  texCache.forEach(t => t.dispose())
  texCache.clear()
  if (placeholderTex) placeholderTex.dispose()
  if (rt) rt.dispose()
  if (vignetteMat) vignetteMat.dispose()
})
</script>

<style scoped>
.sphere-carousel {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: v-bind(bgColor);
}

.sphere-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.sphere-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    v-bind(bgColor) 0%,
    transparent 15%,
    transparent 85%,
    v-bind(bgColor) 100%
  );
  z-index: 1;
}
</style>
