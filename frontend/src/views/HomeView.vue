<template>
  <main>
    <!-- Hero 区域 -->
    <section class="hero-fullwidth">
      <div class="hero-fullwidth-inner">
        <div class="flex flex-col items-center text-center">
          <h1
            class="text-[36px] md:text-[56px] lg:text-[70px] font-semibold leading-tight tracking-tight text-ink mb-6"
            style="letter-spacing: -1.2px;"
          >
            记录孩子的每一笔创意
          </h1>
          <p class="text-body-md md:text-heading-lg text-mute max-w-2xl mb-8 leading-relaxed">
            为家庭打造的儿童画作展示画廊，安全上传、精美展示，珍藏每一个成长瞬间
          </p>
          <router-link to="/gallery" class="btn-primary text-lg px-8 h-12">
            浏览画廊
          </router-link>
        </div>
      </div>
    </section>

    <!-- 精选画作特征行 -->
    <section class="py-16 md:py-section">
      <div class="page-container">
        <div class="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 mb-16 lg:mb-section">
          <div class="flex-1">
            <div class="feature-card-soft">
              <h2
                class="text-heading-xl font-bold tracking-tight text-ink mb-4"
                style="letter-spacing: -1.2px;"
              >
                精美瀑布流展示
              </h2>
              <p class="text-body-md text-body leading-relaxed mb-6">
                画作以自然宽高比排列在瀑布流画廊中，无论是横向风景还是纵向人物，都能完美呈现。支持按上传者筛选，快速找到家人的作品。
              </p>
              <router-link to="/gallery" class="btn-primary">
                查看画廊
              </router-link>
            </div>
          </div>
          <div class="flex-1 w-full">
            <div class="pin-card aspect-[4/3] bg-surface-card flex items-center justify-center">
              <div class="text-center p-8">
                <div class="text-6xl mb-4">🎨</div>
                <p class="text-mute text-body-sm">画作瀑布流预览</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col lg:flex-row-reverse items-center gap-8 lg:gap-16">
          <div class="flex-1">
            <div class="feature-card">
              <h2
                class="text-heading-xl font-bold tracking-tight text-ink mb-4"
                style="letter-spacing: -1.2px;"
              >
                安全便捷的上传
              </h2>
              <p class="text-body-md text-body leading-relaxed mb-6">
                密码保护的上传入口，支持拖拽上传和批量选择。前端自动压缩转 WebP，节省存储空间的同时保持画质清晰。
              </p>
              <router-link to="/upload" class="btn-primary">
                开始上传
              </router-link>
            </div>
          </div>
          <div class="flex-1 w-full">
            <div class="pin-card aspect-[4/3] bg-surface-card flex items-center justify-center">
              <div class="text-center p-8">
                <div class="text-6xl mb-4">📤</div>
                <p class="text-mute text-body-sm">拖拽上传预览</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
// HomeView - 首页
</script>
