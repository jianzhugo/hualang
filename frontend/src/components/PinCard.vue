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
      <div class="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          class="bg-black/50 hover:bg-black/70 rounded-full p-1.5"
          @click.stop="$emit('edit')"
          aria-label="编辑"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
        </button>
        <button
          v-if="!confirmingDelete"
          class="bg-black/50 hover:bg-red-600 rounded-full p-1.5 transition-colors"
          @click.stop="confirmingDelete = true"
          aria-label="删除"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
      <div
        v-if="confirmingDelete"
        class="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 p-4"
        @click.stop
      >
        <p class="text-white text-sm text-center">确定删除「{{ artwork.title }}」？</p>
        <div class="flex gap-2">
          <button
            class="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-1.5 rounded-full transition-colors"
            @click.stop="$emit('delete')"
          >
            删除
          </button>
          <button
            class="bg-white/20 hover:bg-white/30 text-white text-xs px-4 py-1.5 rounded-full transition-colors"
            @click.stop="confirmingDelete = false"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
  delete: []
}>()

const confirmingDelete = ref(false)

const handleError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}
</script>
