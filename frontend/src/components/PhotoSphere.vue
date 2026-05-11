<template>
  <div ref="container" class="photo-sphere-container">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
console.log('[PhotoSphere] === SCRIPT START EXECUTING ===')
import { ref, onMounted, onBeforeUnmount, watch, type PropType } from 'vue'
import * as THREE from 'three'
import type { ArtworkItem } from '../stores/gallery'

const props = defineProps({
  artworks: {
    type: Array as PropType<ArtworkItem[]>,
    default: () => []
  }
})

const container = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
const emit = defineEmits(['loaded'])

const isMobile = () => window.innerWidth < 768

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let cardGroup: THREE.Group
let animationId: number
let textures: THREE.Texture[] = []
let cards: THREE.Mesh[] = []
let animTime = 0
let mouseX = 0
let mouseY = 0
let targetRotationX = 0
let targetRotationY = 0

const CARD_CONFIG = {
  mobile: { count: 20, radius: 5, spread: 3 },
  desktop: { count: 50, radius: 6, spread: 4 }
}

const init = () => {
  if (!container.value || !canvasRef.value) {
    console.error('[PhotoSphere] Container or canvas not found')
    return
  }

  const width = container.value.clientWidth
  const height = container.value.clientHeight

  if (width === 0 || height === 0) {
    console.warn('[PhotoSphere] Container has zero size, retrying...', { width, height })
    setTimeout(init, 100)
    return
  }

  console.log('[PhotoSphere] Initializing with size:', { width, height })

  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      alpha: true,
      antialias: true
    })
  } catch (e) {
    console.error('[PhotoSphere] WebGL creation failed:', e)
    return
  }
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  
  if (canvasRef.value) {
    canvasRef.value.style.position = 'absolute'
    canvasRef.value.style.top = '0'
    canvasRef.value.style.left = '0'
    canvasRef.value.style.width = '100%'
    canvasRef.value.style.height = '100%'
    canvasRef.value.style.zIndex = '9999'
    console.log('[PhotoSphere] Canvas styles forced, WebGL context:', renderer.getContext())
    console.log('[PhotoSphere] Renderer info:', renderer.info)
  }
  
  renderer.shadowMap.enabled = false
  renderer.setClearColor(0x0000ff, 1)  // 蓝色清除色，用于调试

  scene = new THREE.Scene()

  const aspect = width / height
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100)
  camera.position.set(0, 0, 0)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(5, 5, 5)
  scene.add(dirLight)

  cardGroup = new THREE.Group()
  scene.add(cardGroup)

  window.addEventListener('mousemove', onMouseMove)

  if (props.artworks && props.artworks.length > 0) {
    loadTextures()
  } else {
    createFallbackCards()
    emit('loaded')
  }
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const onMouseMove = (e: MouseEvent) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1
  mouseY = (e.clientY / window.innerHeight) * 2 - 1
}

const loadTextures = () => {
  if (!props.artworks || props.artworks.length === 0) {
    createFallbackCards()
    emit('loaded')
    return
  }

  const config = isMobile() ? CARD_CONFIG.mobile : CARD_CONFIG.desktop
  const artworksToLoad = props.artworks.slice(0, config.count)

  let loadedCount = 0
  const total = artworksToLoad.length

  artworksToLoad.forEach((artwork) => {
    if (!artwork.url) {
      loadedCount++
      if (loadedCount >= total) {
        createCards()
        emit('loaded')
      }
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const texture = new THREE.Texture(img)
      texture.needsUpdate = true
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
      textures.push(texture)
      loadedCount++
      if (loadedCount >= total) {
        if (textures.length > 0) {
          createCards()
        } else {
          createFallbackCards()
        }
        emit('loaded')
      }
    }
    img.onerror = () => {
      loadedCount++
      if (loadedCount >= total) {
        if (textures.length > 0) {
          createCards()
        } else {
          createFallbackCards()
        }
        emit('loaded')
      }
    }
    img.src = artwork.url
  })

  if (total === 0) {
    createFallbackCards()
    emit('loaded')
  }
}

const createFallbackCards = () => {
  console.log('[PhotoSphere] Creating fallback cards...')
  cards.forEach((card) => {
    cardGroup.remove(card)
    card.geometry.dispose()
    if (card.material instanceof THREE.Material) {
      card.material.dispose()
    }
  })
  cards = []

  const config = isMobile() ? CARD_CONFIG.mobile : CARD_CONFIG.desktop
  const count = config.count
  const colors = ['#ff6b8a', '#ffb366', '#7ec87e', '#66b3e6', '#b388e6', '#ff9999']

  for (let i = 0; i < count; i++) {
    const colorIndex = seededRandom(i * 17) * colors.length
    const bgColor = colors[Math.floor(colorIndex)]

    const baseSize = isMobile() ? 2.0 : 3.5
    const sizeJitter = 0.8 + seededRandom(i * 31) * 0.6
    const cardH = baseSize * sizeJitter
    const cardW = cardH * (0.8 + seededRandom(i * 43) * 0.4)

    const geometry = new THREE.PlaneGeometry(cardW, cardH)
    
    const material = new THREE.MeshBasicMaterial({
      color: bgColor,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false
    })

    const mesh = new THREE.Mesh(geometry, material)

    const phi = Math.acos(-1 + (2 * i) / count)
    const theta = Math.sqrt(count * Math.PI) * phi
    
    const radius = config.radius + (seededRandom(i * 47) - 0.5) * config.spread
    const x = radius * Math.cos(theta) * Math.sin(phi)
    const y = radius * Math.sin(theta) * Math.sin(phi) * 0.6
    const z = radius * Math.cos(phi) + 2

    mesh.position.set(x, y, z)
    
    mesh.rotation.y = theta + seededRandom(i * 73) * 0.5
    mesh.rotation.x = (seededRandom(i * 59) - 0.5) * 0.3
    mesh.rotation.z = (seededRandom(i * 61) - 0.5) * 0.2

    const distFromCenter = Math.sqrt(x * x + y * y + z * z)
    const normalizedDist = Math.min(distFromCenter / config.radius, 1)
    const opacity = 0.6 + (1 - normalizedDist) * 0.4
    material.opacity = opacity
    
    console.log(`[PhotoSphere] Card ${i}: pos=(${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}), op=${opacity.toFixed(2)}`)

    mesh.userData = {
      basePos: new THREE.Vector3(x, y, z),
      baseRot: new THREE.Euler(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z),
      floatPhaseX: seededRandom(i * 23) * Math.PI * 2,
      floatPhaseY: seededRandom(i * 41) * Math.PI * 2,
      floatPhaseZ: seededRandom(i * 67) * Math.PI * 2,
      floatSpeedX: 0.2 + seededRandom(i * 29) * 0.3,
      floatSpeedY: 0.15 + seededRandom(i * 53) * 0.25,
      floatSpeedZ: 0.1 + seededRandom(i * 71) * 0.2,
      floatAmpX: 0.08 + seededRandom(i * 37) * 0.12,
      floatAmpY: 0.06 + seededRandom(i * 43) * 0.1,
      floatAmpZ: 0.04 + seededRandom(i * 79) * 0.08,
      rotSpeedY: 0.05 + seededRandom(i * 83) * 0.1,
      rotSpeedX: (seededRandom(i * 89) - 0.5) * 0.03,
      breathPhase: seededRandom(i * 97) * Math.PI * 2,
      breathSpeed: 0.3 + seededRandom(i * 101) * 0.2,
      breathAmp: 0.03 + seededRandom(i * 103) * 0.04,
      baseScale: 0.9 + seededRandom(i * 107) * 0.2,
      baseOpacity: opacity
    }

    cardGroup.add(mesh)
    cards.push(mesh)
  }

  startAnimation()
  console.log('[PhotoSphere] Fallback cards created:', cards.length)
}

const createCards = () => {
  cards.forEach((card) => {
    cardGroup.remove(card)
    card.geometry.dispose()
    if (card.material instanceof THREE.Material) {
      card.material.dispose()
    }
  })
  cards = []

  if (!textures.length) {
    createFallbackCards()
    return
  }

  const config = isMobile() ? CARD_CONFIG.mobile : CARD_CONFIG.desktop
  const count = Math.min(textures.length, config.count)

  for (let i = 0; i < count; i++) {
    const texture = textures[i % textures.length]
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false

    const img = texture.image as HTMLImageElement | undefined
    const imgAspect = img ? Math.max(Math.min(img.width / img.height, 1.6), 0.6) : 1

    const baseSize = isMobile() ? 0.8 : 1.2
    const sizeJitter = 0.7 + seededRandom(i * 31) * 0.6
    const cardH = baseSize * sizeJitter
    const cardW = cardH * imgAspect

    const geometry = new THREE.PlaneGeometry(cardW, cardH)
    
    const textureCanvas = document.createElement('canvas')
    textureCanvas.width = 256
    textureCanvas.height = Math.floor(256 / imgAspect)
    const ctx = textureCanvas.getContext('2d')!

    ctx.fillStyle = '#ffffff'
    roundRect(ctx, 0, 0, textureCanvas.width, textureCanvas.height, 12)
    ctx.fill()

    ctx.save()
    roundedClip(ctx, 4, 4, textureCanvas.width - 8, textureCanvas.height - 8, 8)
    ctx.drawImage(img || new Image(), 4, 4, textureCanvas.width - 8, textureCanvas.height - 8)
    ctx.restore()

    const cardTexture = new THREE.CanvasTexture(textureCanvas)
    cardTexture.needsUpdate = true

    const material = new THREE.MeshBasicMaterial({
      map: cardTexture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    })

    const mesh = new THREE.Mesh(geometry, material)

    const phi = Math.acos(-1 + (2 * i) / count)
    const theta = Math.sqrt(count * Math.PI) * phi
    
    const radius = config.radius + (seededRandom(i * 47) - 0.5) * config.spread
    const x = radius * Math.cos(theta) * Math.sin(phi)
    const y = radius * Math.sin(theta) * Math.sin(phi) * 0.6
    const z = radius * Math.cos(phi) - 5

    mesh.position.set(x, y, z)
    
    mesh.rotation.y = theta + seededRandom(i * 73) * 0.5
    mesh.rotation.x = (seededRandom(i * 59) - 0.5) * 0.3
    mesh.rotation.z = (seededRandom(i * 61) - 0.5) * 0.2

    const distFromCenter = Math.sqrt(x * x + y * y + z * z)
    const normalizedDist = Math.min(distFromCenter / config.radius, 1)
    const opacity = 0.3 + (1 - normalizedDist) * 0.7
    material.opacity = opacity

    mesh.userData = {
      basePos: new THREE.Vector3(x, y, z),
      baseRot: new THREE.Euler(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z),
      floatPhaseX: seededRandom(i * 23) * Math.PI * 2,
      floatPhaseY: seededRandom(i * 41) * Math.PI * 2,
      floatPhaseZ: seededRandom(i * 67) * Math.PI * 2,
      floatSpeedX: 0.2 + seededRandom(i * 29) * 0.3,
      floatSpeedY: 0.15 + seededRandom(i * 53) * 0.25,
      floatSpeedZ: 0.1 + seededRandom(i * 71) * 0.2,
      floatAmpX: 0.08 + seededRandom(i * 37) * 0.12,
      floatAmpY: 0.06 + seededRandom(i * 43) * 0.1,
      floatAmpZ: 0.04 + seededRandom(i * 79) * 0.08,
      rotSpeedY: 0.05 + seededRandom(i * 83) * 0.1,
      rotSpeedX: (seededRandom(i * 89) - 0.5) * 0.03,
      breathPhase: seededRandom(i * 97) * Math.PI * 2,
      breathSpeed: 0.3 + seededRandom(i * 101) * 0.2,
      breathAmp: 0.03 + seededRandom(i * 103) * 0.04,
      baseScale: 0.9 + seededRandom(i * 107) * 0.2,
      baseOpacity: opacity
    }

    cardGroup.add(mesh)
    cards.push(mesh)
  }

  startAnimation()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function roundedClip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  ctx.clip()
}

const startAnimation = () => {
  console.log('[PhotoSphere] Starting animation with', cards.length, 'cards')
  console.log('[PhotoSphere] cardGroup children count:', cardGroup.children.length)
  
  const testGeo = new THREE.PlaneGeometry(10, 10)
  const testMat = new THREE.MeshBasicMaterial({ 
    color: 0xff00ff,  // 紫色
    side: THREE.DoubleSide
  })
  const testMesh = new THREE.Mesh(testGeo, testMat)
  testMesh.position.set(0, 0, -5)
  cardGroup.add(testMesh)  // 添加到 cardGroup 而不是 scene
  console.log('[PhotoSphere] Added PURPLE TEST MESH to cardGroup at (0,0,-5)')
  
  let lastTime = performance.now()

  const animate = () => {
    animationId = requestAnimationFrame(animate)

    const now = performance.now()
    const dt = Math.min((now - lastTime) / 1000, 0.05)
    lastTime = now

    animTime += dt

    targetRotationY = mouseX * 0.3
    targetRotationX = mouseY * 0.2

    cardGroup.rotation.y += (targetRotationY - cardGroup.rotation.y) * 0.02
    cardGroup.rotation.x += (targetRotationX - cardGroup.rotation.x) * 0.02

    cards.forEach((card) => {
      const d = card.userData

      const floatX = Math.sin(animTime * d.floatSpeedX + d.floatPhaseX) * d.floatAmpX
      const floatY = Math.sin(animTime * d.floatSpeedY + d.floatPhaseY) * d.floatAmpY
      const floatZ = Math.cos(animTime * d.floatSpeedZ + d.floatPhaseZ) * d.floatAmpZ

      card.position.x = d.basePos.x + floatX
      card.position.y = d.basePos.y + floatY
      card.position.z = d.basePos.z + floatZ

      card.rotation.y = d.baseRot.y + animTime * d.rotSpeedY
      card.rotation.x = d.baseRot.x + Math.sin(animTime * d.rotSpeedX * 10) * 0.05

      const breathe = 1 + Math.sin(animTime * d.breathSpeed + d.breathPhase) * d.breatheAmp
      const scale = d.baseScale * breathe
      card.scale.set(scale, scale, scale)

      if (card.material instanceof THREE.Material) {
        const opacityWave = Math.sin(animTime * 0.2 + d.floatPhaseY) * 0.05
        card.material.opacity = Math.max(0.1, d.baseOpacity + opacityWave)
      }
    })

    renderer.render(scene, camera)
    
    if (Math.floor(animTime * 2) % 10 === 0) {
      console.log('[PhotoSphere] Render frame at time:', animTime.toFixed(2))
    }
  }
  animate()
}

const handleResize = () => {
  if (!container.value) return
  const width = container.value.clientWidth
  const height = container.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

watch(() => props.artworks, () => {
  textures = []
  cards = []
  animTime = 0
  
  if (props.artworks && props.artworks.length > 0) {
    loadTextures()
  } else {
    createFallbackCards()
  }
})

onMounted(() => {
  init()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', onMouseMove)
  renderer?.dispose()
  textures.forEach((t) => t.dispose())
})
</script>

<style scoped>
.photo-sphere-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
