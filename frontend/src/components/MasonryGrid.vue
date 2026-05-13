<template>
  <div class="masonry-grid">
    <div v-for="artwork in artworks" :key="artwork.key" class="masonry-item">
      <PinCard
        :artwork="artwork"
        :aspect-ratio="getAspectRatio(artwork.key)"
        @click="$emit('select', artwork)"
        @edit="$emit('edit', artwork)"
        @delete="$emit('delete', artwork)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import PinCard from './PinCard.vue'
import type { ArtworkItem } from '../stores/gallery'

interface Props {
  artworks: ArtworkItem[]
}

defineProps<Props>()

defineEmits<{
  select: [artwork: ArtworkItem]
  edit: [artwork: ArtworkItem]
  delete: [artwork: ArtworkItem]
}>()

const getAspectRatio = (key: string): string => {
  const hash = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const ratios = ['1/1', '3/4', '4/5', '2/3', '1/1']
  return ratios[hash % ratios.length]
}
</script>

<style scoped>
.masonry-grid {
  columns: 280px;
  column-gap: 8px;
}

@media (max-width: 639px) {
  .masonry-grid {
    columns: 2;
  }
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 8px;
}
</style>
