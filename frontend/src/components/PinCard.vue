<template>
  <div class="pin-card cursor-pointer group" @click="$emit('click')">
    <div class="relative overflow-hidden">
      <img
        :src="artwork.url || ''"
        :alt="artwork.title"
        :style="{ aspectRatio: aspectRatio }"
        class="w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        loading="lazy"
        @error="handleError"
      />
      <div
        class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        <p class="text-white text-sm font-semibold truncate">{{ artwork.title }}</p>
        <p class="text-white/70 text-xs">{{ artwork.uploader }} · {{ artwork.date }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ArtworkItem } from '../stores/gallery'

interface Props {
  artwork: ArtworkItem
  aspectRatio?: string
}

withDefaults(defineProps<Props>(), {
  aspectRatio: '1/1'
})

defineEmits<{
  click: []
}>()

const handleError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}
</script>
