<template>
  <div class="hero-background">
    <video
      v-if="isVideo"
      ref="videoRef"
      class="bg-media"
      :src="src"
      autoplay
      loop
      muted
      playsinline
    />
    <img
      v-else
      :src="src"
      :alt="alt"
      class="bg-media"
      loading="eager"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  src: string
  alt?: string
}>(), {
  alt: 'Hero background'
})

const isVideo = computed(() => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov']
  return videoExtensions.some(ext => props.src.toLowerCase().endsWith(ext))
})
</script>

<style scoped>
.hero-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.bg-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}
</style>
