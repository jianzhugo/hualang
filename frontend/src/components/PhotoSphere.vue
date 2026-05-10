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

let scene: THREE.Scene
let camera: THREE.OrthographicCamera
let renderer: THREE.WebGLRenderer
let spriteGroup: THREE.Group
let animationId: number
let dragRotationSpeed = { x: 0, y: 0 }
let isDragging = false
let prevMouseX = 0
let prevMouseY = 0
let textures: THREE.Texture[] = []
let meshes: THREE.Mesh[] = []

const isMobile = () => window.innerWidth < 768

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

  const frustum = 14
  const aspect = width / height
  camera = new THREE.OrthographicCamera(
    -frustum * aspect,
    frustum * aspect,
    frustum,
    -frustum,
    0.1,
    1000
  )
  camera.position.z = 20

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

  const maxCount = isMobile() ? 15 : 50
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
  while (spriteGroup.children.length > 0) {
    const child = spriteGroup.children[0]
    spriteGroup.remove(child)
    child.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if ((obj as THREE.Mesh).material instanceof THREE.Material) {
          ((obj as THREE.Mesh).material as THREE.Material).dispose()
        }
      }
    })
  }
  meshes = []

  if (!textures.length) return

  const count = Math.min(textures.length, isMobile() ? 15 : 50)

  const cols = Math.ceil(Math.sqrt(count * 2))
  const rows = Math.ceil(count / cols)

  const tileW = 1.8
  const tileH = 2.0

  const startX = -((cols - 1) * (tileW + 0.4)) / 2
  const startY = ((rows - 1) * (tileH + 0.4)) / 2

  for (let i = 0; i < count; i++) {
    if (i >= textures.length) return

    const texture = textures[i]
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter

    const img = texture.image as HTMLImageElement | undefined
    const aspect = img ? img.width / img.height : 1

    const col = i % cols
    const row = Math.floor(i / cols)

    const seed = i * 137 + 42

    const offsetX = (seededRandom(seed + 1) - 0.5) * 0.6
    const offsetY = (seededRandom(seed + 2) - 0.5) * 0.4

    const x = startX + col * (tileW + 0.4) + offsetX
    const y = startY - row * (tileH + 0.4) + offsetY

    const depthZ = (seededRandom(seed + 3) - 0.5) * 6

    const baseH = tileH * (0.85 + seededRandom(seed + 4) * 0.3)
    const planeWidth = baseH * aspect
    const planeHeight = baseH

    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    })
    const mesh = new THREE.Mesh(geometry, material)

    mesh.position.set(x, y, depthZ)
    mesh.rotation.z = (seededRandom(seed + 5) - 0.5) * 0.08

    mesh.userData = {
      baseY: y,
      baseZ: depthZ,
      phaseX: seededRandom(seed + 6) * Math.PI * 2,
      phaseY: seededRandom(seed + 7) * Math.PI * 2,
      speedX: 0.3 + seededRandom(seed + 8) * 0.3,
      speedY: 0.2 + seededRandom(seed + 9) * 0.2,
      ampX: 0.15 + seededRandom(seed + 10) * 0.1,
      ampY: 0.1 + seededRandom(seed + 11) * 0.08
    }

    spriteGroup.add(mesh)
    meshes.push(mesh)
  }

  startAnimation()
}

const startAnimation = () => {
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    spriteGroup.rotation.y += 0.001 + dragRotationSpeed.x
    spriteGroup.rotation.x += dragRotationSpeed.y

    dragRotationSpeed.x *= 0.95
    dragRotationSpeed.y *= 0.95

    const time = Date.now() * 0.001

    meshes.forEach((mesh) => {
      const d = mesh.userData
      const floatY = Math.sin(time * d.speedY + d.phaseY) * d.ampY
      const floatX = Math.cos(time * d.speedX + d.phaseX) * d.ampX
      mesh.position.y = d.baseY + floatY
      mesh.position.x = d.baseX + floatX
    })

    renderer.render(scene, camera)
  }
  animate()
}

const startDrag = (e: MouseEvent | TouchEvent) => {
  isDragging = true
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  prevMouseX = clientX
  prevMouseY = clientY
  dragRotationSpeed.x = 0
  dragRotationSpeed.y = 0
}

const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging) return
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const deltaX = clientX - prevMouseX
  const deltaY = clientY - prevMouseY
  dragRotationSpeed.y = deltaX * 0.00008
  dragRotationSpeed.x = -deltaY * 0.00005
  prevMouseX = clientX
  prevMouseY = clientY
}

const stopDrag = () => {
  isDragging = false
}

const handleResize = () => {
  if (!container.value) return
  const width = container.value.clientWidth
  const height = container.value.clientHeight
  const aspect = width / height
  const frustum = 14
  camera.left = -frustum * aspect
  camera.right = frustum * aspect
  camera.top = frustum
  camera.bottom = -frustum
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

watch(() => props.artworks, () => {
  textures = []
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
