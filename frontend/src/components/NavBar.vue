<template>
  <nav class="sticky top-0 z-50 h-16 border-b border-hairline glass-nav">
    <div class="page-container h-full flex items-center justify-between">
      <button class="md:hidden p-2" @click="mobileOpen = !mobileOpen" :aria-label="mobileOpen ? '关闭菜单' : '打开菜单'">
        <Menu v-if="!mobileOpen" :size="24" />
        <X v-else :size="24" />
      </button>

      <router-link to="/" class="text-lg font-semibold text-ink hover:text-primary transition-colors shrink-0">
        小小艺境
      </router-link>

      <div class="hidden md:flex items-center gap-2">
        <router-link v-for="item in navItems" :key="item.to" :to="item.to"
          class="relative px-4 py-3 text-body-md font-medium transition-colors"
          :class="$route.path === item.to ? 'text-ink' : 'text-mute hover:text-ink'">
          {{ item.label }}
          <span v-if="$route.path === item.to"
            class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
        </router-link>
      </div>

      <router-link
        to="/upload"
        class="inline-flex items-center justify-center h-10 px-4 text-sm font-bold rounded-md bg-primary text-on-primary hover:bg-primary-pressed transition-colors shrink-0"
      >
        上传画作
      </router-link>
    </div>

    <Teleport to="body">
      <div v-if="mobileOpen" class="fixed inset-0 top-16 z-40 bg-canvas md:hidden" @click="mobileOpen = false">
        <div class="flex flex-col p-6 gap-2" @click.stop>
          <router-link v-for="item in navItems" :key="item.to" :to="item.to"
            class="block px-4 py-3 rounded-md text-lg font-medium transition-colors"
            :class="$route.path === item.to ? 'bg-surface-card text-ink' : 'text-mute hover:bg-surface-card hover:text-ink'"
            @click="mobileOpen = false">
            {{ item.label }}
          </router-link>
        </div>
      </div>
    </Teleport>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Menu, X } from 'lucide-vue-next'

const mobileOpen = ref(false)

const navItems = [
  { label: '首页', to: '/' },
  { label: '画廊', to: '/gallery' },
  { label: '上传', to: '/upload' },
  { label: '关于', to: '/about' }
]
</script>

<style scoped>
.glass-nav {
  background-color: rgba(255, 255, 255, 0.5);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  transform: translateZ(0);
  will-change: transform;
}
</style>
