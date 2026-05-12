<template>
  <footer class="glass-footer relative z-10 py-8 px-6">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <router-link to="/" class="text-lg font-semibold text-ink">小小艺境</router-link>
      <div class="flex items-center gap-6 text-sm text-mute">
        <router-link to="/" class="hover:text-ink transition-colors">首页</router-link>
        <router-link to="/gallery" class="hover:text-ink transition-colors">画廊</router-link>
        <router-link to="/upload" class="hover:text-ink transition-colors">上传</router-link>
        <router-link to="/about" class="hover:text-ink transition-colors">关于</router-link>
      </div>
      <p class="text-xs text-ash">&copy; {{ currentYear }} 未来之星</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.glass-footer {
  background-color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid #e5e7eb;
}
</style>
