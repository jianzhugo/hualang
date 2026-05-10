<template>
  <div ref="container" class="photo-sphere-container" @mousedown="startDrag" @mousemove="onDrag" @mouseup="stopDrag" @mouseleave="stopDrag" @touchstart="startDrag" @touchmove="onDrag" @touchend="stopDrag">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
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
const canvas = ref<HTMLCanvasElement>()
const emit = defineEmits(['loaded'])

const isMobile = () => window.innerWidth < 768

interface TrackData {
  meshes: THREE.Mesh[]
  speed: number
  trackWidth: number
}

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let spriteGroup: THREE.Group
let animationId: number
let dragVelocity = { x: 0, y: 0 }
let isDragging = false
let prevMouseX = 0
let prevMouseY = 0
let dragActive = false
let textures: THREE.Texture[] = []
let tracks: TrackData[] = []
let animTime = 0
const tempVec = new THREE.Vector3()

const init = () => {
  if (!container.value || !canvas.value) return

  const width = container.value.clientWidth
  const height = container.value.clientHeight

  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    alpha: true,
    antialias: true
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  scene = new THREE.Scene()

  const aspect = width / height
  camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 100)
  camera.position.set(0, 0, 0)

  spriteGroup = new THREE.Group()
  scene.add(spriteGroup)

  loadTextures()
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const loadTextures = () => {
  if (!props.artworks.length) return

  const maxCount = isMobile() ? 24 : 72
  const artworksToLoad = props.artworks.slice(0, maxCount)

  let loadedCount = 0
  const total = artworksToLoad.length

  artworksToLoad.forEach((artwork) => {
    if (!artwork.url) {
      loadedCount++
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
        createSprites()
        emit('loaded')
      }
    }
    img.onerror = () => {
      loadedCount++
    }
    img.src = artwork.url
  })

  if (total === 0) {
    emit('loaded')
  }
}

const createSprites = () => {
  tracks.forEach((track) => {
    track.meshes.forEach((mesh) => {
      scene.remove(mesh)
      mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose()
      }
    })
  })
  tracks = []

  if (!textures.length) return

  const count = Math.min(textures.length, isMobile() ? 24 : 72)
  const trackCount = isMobile() ? 4 : 6
  const itemsPerTrack = Math.ceil(count / trackCount)

  const aspect = container.value?.clientWidth && container.value?.clientHeight
    ? container.value.clientWidth / container.value.clientHeight
    : 16 / 9
  const fovRad = (camera.fov * Math.PI) / 180
  const halfFovTan = Math.tan(fovRad / 2)

  for (let t = 0; t < trackCount; t++) {
    const trackMeshes: THREE.Mesh[] = []
    const depthRatio = t / Math.max(trackCount - 1, 1)

    const zDepth = -(3 + depthRatio * 19)
    const dist = Math.abs(zDepth)

    const speed = 0.035 + (1 - depthRatio) * 0.040

    const visibleH = 2 * halfFovTan * dist
    const visibleW = visibleH * aspect
    const trackWidth = visibleW * 2.4
    const trackHeight = visibleH * 1.4

    const cellW = trackWidth / itemsPerTrack

    for (let i = 0; i < itemsPerTrack; i++) {
      const idx = (t * itemsPerTrack + i) % textures.length
      if (idx >= textures.length) break

      const texture = textures[idx]
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.generateMipmaps = false

      const img = texture.image as HTMLImageElement | undefined
      const imgAspect = img ? Math.max(Math.min(img.width / img.height, 1.8), 0.5) : 1

      const worldSize = dist * 0.14
      const sizeJitter = 0.7 + seededRandom(t * 97 + i * 31) * 0.6
      const planeH = worldSize * sizeJitter
      const planeW = planeH * imgAspect

      const geometry = new THREE.PlaneGeometry(planeW, planeH)
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.25 + (1 - depthRatio) * 0.55,
        side: THREE.DoubleSide,
        depthWrite: false
      })
      const mesh = new THREE.Mesh(geometry, material)

      const colOffset = (i - itemsPerTrack / 2 + 0.5) * cellW
      const jitterX = (seededRandom(t * 13 + i * 67) - 0.5) * cellW * 0.4
      const x = colOffset + jitterX

      const jitterY = (seededRandom(t * 43 + i * 53 + 9) - 0.5) * trackHeight * 0.7
      const y = jitterY

      const rotZ = (seededRandom(t * 31 + i * 41 + 17) - 0.5) * 0.3
      const rotX = (seededRandom(t * 23 + i * 37 + 5) - 0.5) * 0.12

      mesh.position.set(x, y, zDepth)
      mesh.rotation.z = rotZ
      mesh.rotation.x = rotX

      mesh.userData = {
        baseX: x,
        baseY: y,
        baseZ: zDepth,
        rotZ,
        rotX,
        floatPhase: seededRandom(t * 59 + i * 73 + 11) * Math.PI * 2,
        floatSpeed: 0.3 + seededRandom(t * 61 + i * 79 + 3) * 0.3,
        floatAmp: 0.15 + seededRandom(t * 67 + i * 83 + 7) * 0.25
      }

      scene.add(mesh)
      trackMeshes.push(mesh)
    }

    tracks.push({ meshes: trackMeshes, speed, trackWidth })
  }

  startAnimation()
}

const startAnimation = () => {
  let lastTime = performance.now()

  const animate = () => {
    animationId = requestAnimationFrame(animate)

    const now = performance.now()
    const dt = Math.min((now - lastTime) / 1000, 0.05)
    lastTime = now

    animTime += dt

    const dragInfluence = 1 + Math.abs(dragVelocity.y) * 4

    tracks.forEach((track) => {
      const offset = animTime * track.speed * 12 * dragInfluence

      track.meshes.forEach((mesh) => {
        const d = mesh.userData
        let newX = d.baseX - offset

        const halfW = track.trackWidth / 2
        if (newX < d.baseX - halfW) {
          newX += track.trackWidth
        }

        const floatY = Math.sin(animTime * d.floatSpeed + d.floatPhase) * d.floatAmp

        tempVec.set(newX, d.baseY + floatY, d.baseZ)
        tempVec.applyEuler(spriteGroup.rotation)
        mesh.position.copy(tempVec)
        mesh.rotation.set(0, 0, 0)
      })
    })

    if (Math.abs(dragVelocity.x) > 0.0001 || Math.abs(dragVelocity.y) > 0.0001 || dragActive) {
      spriteGroup.rotation.x += dragVelocity.x
      spriteGroup.rotation.y += dragVelocity.y
      spriteGroup.rotation.x = Math.max(Math.min(spriteGroup.rotation.x, 0.6), -0.6)

      if (!dragActive) {
        dragVelocity.x *= 0.92
        dragVelocity.y *= 0.92
        if (Math.abs(dragVelocity.x) < 0.0001) dragVelocity.x = 0
        if (Math.abs(dragVelocity.y) < 0.0001) dragVelocity.y = 0
      }
    }

    renderer.render(scene, camera)
  }
  animate()
}

const startDrag = (e: MouseEvent | TouchEvent) => {
  isDragging = true
  dragActive = true
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  prevMouseX = clientX
  prevMouseY = clientY
}

const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging) return
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const deltaX = clientX - prevMouseX
  const deltaY = clientY - prevMouseY

  dragVelocity.x = Math.max(Math.min(deltaY * 0.003, 0.04), -0.04)
  dragVelocity.y = Math.max(Math.min(deltaX * 0.003, 0.04), -0.04)

  prevMouseX = clientX
  prevMouseY = clientY
}

const stopDrag = () => {
  isDragging = false
  dragActive = false
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
  animTime = 0
  loadTextures()
})

onMounted(() => {
  init()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
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