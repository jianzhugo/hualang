<template>
  <div class="about-page">
    <div class="gradient" ref="gradientRef"></div>
    <main class="page-container py-8 content-layer">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const gradientRef = ref<HTMLDivElement | null>(null);

// 鼠标跟随渐变效果
const onMouseMove = (event: MouseEvent) => {
  if (gradientRef.value) {
    /*
      渐变颜色调整：
      - rgba(83,227,166,.8) = 中心颜色（绿色），.8 为透明度
      - #50a3a2 = 外围颜色
      - 70% = 渐变扩散范围
      示例改法：
      - 改颜色：rgba(红,绿,蓝,.透明度) 和 #十六进制色
      - 改透明度：.8 改为 .5 更透，.9 更实
      - 改扩散：70% 改大更平滑，改小更集中
    */
    gradientRef.value.style.backgroundImage = 'radial-gradient(at ' + event.clientX + 'px ' + event.clientY + 'px, rgba(83,227,166,.8) 0, #50a3a2 50%)';
  }
};

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove);
});

const familyMembers = [
  { name: '爸爸', role: '上传者', avatar: '👨' },
  { name: '妈妈', role: '上传者', avatar: '' },
  { name: '爷爷', role: '上传者', avatar: '👴' },
  { name: '奶奶', role: '上传者', avatar: '👵' }
];
</script>

<style scoped>
/*
  背景设置：
  - 修改 url() 更换背景图路径
  - background-size: cover 覆盖全图，改 contain 可完整显示不裁剪
  - background-position: center 可改 top/bottom/left/right
*/
.about-page {
  position: relative;
  min-height: 100vh;
  background-image: url('../assets/shangchuan-bg.webp');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

/*
  渐变层设置：
  - z-index 控制层级，-1 在背景之上，1 在内容之下
  - 初始背景色（鼠标不动时显示的颜色），与 JS 中保持一致
*/
.gradient {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background-image: radial-gradient(at 300px 300px, rgba(83,227,166,.8) 0, #50a3a2 70%);
}

.content-layer {
  position: relative;
  z-index: 1;
}

/*
  卡片半透明背景：
  - rgba(255,255,255,.85) 中 .85 为透明度，改小更透
  - backdrop-filter: blur(8px) 毛玻璃模糊度，改大更模糊
*/
:deep(.feature-card) {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

:deep(.feature-card-soft) {
  background: rgba(255, 255, 255, 0.75) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
</style>
