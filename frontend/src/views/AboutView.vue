<template>
  <main class="page-container py-8">
    <h1
      class="text-heading-xl font-bold tracking-tight text-ink mb-2"
      style="letter-spacing: -1.2px;"
    >
      关于我们
    </h1>
    <p class="text-body-md text-mute mb-10">了解儿童画廊的故事</p>

    <!-- 项目介绍 -->
    <section class="mb-12">
      <div class="feature-card">
        <h2 class="text-heading-lg font-semibold text-ink mb-4">项目介绍</h2>
        <p class="text-body-md text-body leading-relaxed mb-4">
          儿童画廊是一个为家庭打造的纯静态画作展示网站。我们的初衷很简单：让孩子的每一幅画作都有一个安全、美观的展示空间。
        </p>
        <p class="text-body-md text-body leading-relaxed">
          采用 Vue3 + Cloudflare R2/Workers 架构，无需服务器维护，低成本高可用。画作在前端自动压缩为 WebP 格式，节省存储空间的同时保持清晰画质。
        </p>
      </div>
    </section>

    <!-- 家庭成员 -->
    <section class="mb-12">
      <h2 class="text-heading-lg font-semibold text-ink mb-6">家庭成员</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="member in familyMembers"
          :key="member.name"
          class="feature-card-soft text-center"
        >
          <div
            class="w-16 h-16 rounded-full bg-surface-card mx-auto mb-3 flex items-center justify-center text-2xl"
          >
            {{ member.avatar }}
          </div>
          <p class="text-body-sm font-semibold text-ink">{{ member.name }}</p>
          <p class="text-caption-sm text-mute">{{ member.role }}</p>
        </div>
      </div>
    </section>

    <!-- 技术栈 -->
    <section>
      <h2 class="text-heading-lg font-semibold text-ink mb-6">技术栈</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="feature-card-soft">
          <h3 class="text-heading-md font-semibold text-ink mb-2">前端</h3>
          <p class="text-body-sm text-mute">
            Vue 3 + TypeScript + Vite + Pinia + Vue Router + TailwindCSS
          </p>
        </div>
        <div class="feature-card-soft">
          <h3 class="text-heading-md font-semibold text-ink mb-2">后端</h3>
          <p class="text-body-sm text-mute">Cloudflare Workers + R2 对象存储</p>
        </div>
        <div class="feature-card-soft">
          <h3 class="text-heading-md font-semibold text-ink mb-2">托管</h3>
          <p class="text-body-sm text-mute">腾讯云 EdgeOne Pages（静态托管）</p>
        </div>
        <div class="feature-card-soft">
          <h3 class="text-heading-md font-semibold text-ink mb-2">设计</h3>
          <p class="text-body-sm text-mute">Pinterest 风格设计系统，暖奶油色系</p>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
const familyMembers = [
  { name: '爸爸', role: '上传者', avatar: '👨' },
  { name: '妈妈', role: '上传者', avatar: '👩' },
  { name: '爷爷', role: '上传者', avatar: '👴' },
  { name: '奶奶', role: '上传者', avatar: '👵' }
]
</script>
