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
        <p class="text-white/70 text-xs">{{ artwork.author }} · {{ artwork.createdDate || artwork.date }}</p>
      </div>
      <button
        class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 hover:bg-black/70 rounded-full p-1.5"
        @click.stop="$emit('edit')"
        aria-label="编辑"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
      </button>
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
  edit: []
}>()

const handleError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}
</script>
