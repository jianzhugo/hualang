<template>
  <div class="app-root">
    <GalaxyBackground ref="galaxyRef" />
    <NavBar />
    <div class="flex-1">
      <router-view v-slot="{ Component }">
        <keep-alive :include="['GalleryView', 'UploadView']">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from './components/NavBar.vue'
import Footer from './components/Footer.vue'
import GalaxyBackground from './components/GalaxyBackground.vue'

const route = useRoute()
const galaxyRef = ref<InstanceType<typeof GalaxyBackground> | null>(null)

const GALAXY_ROUTES = new Set(['/', '/gallery'])

watch(() => route.path, (path) => {
  if (galaxyRef.value) {
    if (GALAXY_ROUTES.has(path)) {
      galaxyRef.value.start()
    } else {
      galaxyRef.value.stop()
    }
  }
}, { immediate: true })
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-canvas);
  isolation: isolate;
}
</style>
