<template>
  <div class="grid gap-2" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
    <div v-for="artwork in artworks" :key="artwork.key" class="break-inside-avoid">
      <PinCard
        :artwork="artwork"
        :aspect-ratio="getAspectRatio(artwork.key)"
        @click="$emit('select', artwork)"
        @edit="$emit('edit', artwork)"
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
}>()

const getAspectRatio = (key: string): string => {
  const hash = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const ratios = ['1/1', '3/4', '4/5', '2/3', '1/1']
  return ratios[hash % ratios.length]
}
</script>
