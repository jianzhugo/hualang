# 🎨 小小艺境

> 小小的手，画出大大的世界

一个为家庭儿童画作打造的在线画廊应用，采用 Cloudflare 无服务器架构，支持图片上传、展示、筛选与管理。

🌐 **在线预览**：[https://art.shuichanga.cn](https://art.shuichanga.cn)

![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.2-06B6D4?logo=tailwindcss&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-Wrangler%203-F38020?logo=cloudflare&logoColor=white)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare%20R2-Storage-F38020?logo=cloudflare&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.184-000000?logo=three.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ 功能特性

### 🏠 首页

- 全屏 Hero 区域，渐变动画标题
- 优秀作品精选展示（带"棒"标签筛选）
- 按作者分组的作品轮播

### 🖼️ 画廊

- **3D 球体背景**：Three.js 实现的球体轮播，支持拖拽旋转与自动播放
- **瀑布流布局**：响应式 Masonry Grid，移动端 2 列 / 桌面端自适应
- **多维度筛选**：按作者、标签、日期范围、上传者筛选
- **灵活排序**：上传日期 / 创作日期升序或降序
- **灯箱预览**：全屏查看大图，支持左右切换
- **编辑与删除**：密码验证后可修改作品信息或删除作品
- **R2 同步**：一键同步孤立文件到元数据

### 📤 上传

- 密码验证保护上传入口
- 拖拽或点击选择图片
- 浏览器端 WebP 压缩（智能质量调节）
- 并行上传 + 串行注册，确保元数据一致性
- 上传队列实时状态展示

### ℹ️ 关于

- 项目介绍与作者展示
- 呼吸光效头像动画
- 鼠标跟随渐变背景

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────┐
│                  浏览器 (SPA)                     │
│  Vue 3 + Pinia + Vue Router + TailwindCSS v4     │
│  Three.js · Lucide Icons · browser-compression   │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────┐
│            Cloudflare Workers                     │
│  Token 验证 · 图片上传 · 元数据注册               │
│  ETag 乐观锁 · 条件写入检测 · 自动重试            │
└──────────┬───────────────────────┬──────────────┘
           │                       │
┌──────────▼──────────┐ ┌─────────▼──────────────┐
│   Cloudflare R2     │ │   metadata.json        │
│   图片对象存储       │ │   作品元数据 (ETag 锁)  │
└─────────────────────┘ └────────────────────────┘
```

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.5 | 前端框架 |
| Vue Router | 5.0 | 路由管理 |
| Pinia | 3.0 | 状态管理 |
| TypeScript | 6.0 | 类型安全 |
| Vite | 8.0 | 构建工具 |
| TailwindCSS | 4.2 | 原子化 CSS |
| Three.js | 0.184 | 3D 球体轮播 |
| axios | 1.16 | HTTP 请求 |
| Lucide Vue Next | 1.0 | 图标库 |
| browser-image-compression | 2.0 | 浏览器端图片压缩 |

### 后端技术栈

| 技术 | 用途 |
|------|------|
| Cloudflare Workers | 无服务器 API |
| Cloudflare R2 | 对象存储 |
| ETag 乐观并发控制 | 元数据写入安全 |

---

## 📁 项目结构

```
hualang/
├── frontend/                  # 前端 Vue 3 项目
│   ├── src/
│   │   ├── api/client.ts      # API 客户端封装
│   │   ├── assets/            # 静态资源
│   │   ├── components/        # Vue 组件
│   │   │   ├── SphereCarousel.vue   # Three.js 3D 球体轮播
│   │   │   ├── MasonryGrid.vue      # 瀑布流布局
│   │   │   ├── PinCard.vue          # 画作卡片
│   │   │   ├── Lightbox.vue         # 灯箱预览
│   │   │   ├── ArtworkEditDialog.vue # 编辑对话框
│   │   │   ├── AuthorCarousel.vue   # 作者轮播
│   │   │   ├── FilterPanel.vue      # 筛选面板
│   │   │   ├── SortDropdown.vue     # 排序下拉
│   │   │   ├── NavBar.vue           # 导航栏
│   │   │   └── Footer.vue           # 页脚
│   │   ├── composables/       # 组合式函数
│   │   │   └── useImageCompress.ts  # 图片压缩
│   │   ├── router/            # 路由配置
│   │   ├── stores/            # Pinia 状态管理
│   │   │   ├── gallery.ts     # 画廊数据
│   │   │   └── upload.ts      # 上传流程
│   │   ├── views/             # 页面视图
│   │   │   ├── HomeView.vue   # 首页
│   │   │   ├── GalleryView.vue # 画廊页
│   │   │   ├── UploadView.vue # 上传页
│   │   │   └── AboutView.vue  # 关于页
│   │   ├── App.vue
│   │   ├── main.ts
│   │   └── style.css          # 全局样式 + Tailwind 主题
│   ├── .env.development
│   ├── .env.production
│   ├── vite.config.ts
│   └── package.json
├── workers/                   # 后端 Cloudflare Workers
│   ├── src/index.ts           # 全部 API 逻辑
│   ├── wrangler.toml          # 部署配置
│   └── package.json
└── README.md
```

---

## 🚀 部署教程

### 前提条件

- [Node.js](https://nodejs.org/) >= 18
- [Cloudflare 账号](https://dash.cloudflare.com/sign-up)（免费套餐即可）
- 域名（可选，也可使用 Workers 自带的 `.workers.dev` 域名）

### 第一步：创建 R2 存储桶

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **R2 对象存储** → **创建存储桶**
3. 存储桶名称填写 `kids-art-gallery`（或自定义名称，需与 `wrangler.toml` 中一致）
4. 区域选择离你最近的即可

### 第二步：部署后端 Workers

```bash
# 进入后端目录
cd workers

# 安装依赖
npm install

# 登录 Cloudflare
npx wrangler login

# 设置上传密码（替换为你的密码，多个密码用逗号分隔）
npx wrangler secret put UPLOAD_PASSWORDS
# 按提示输入密码值，例如：mypassword123

# 部署
npm run deploy
```

部署成功后，Workers 会输出一个 URL，例如 `https://gallery-api.your-subdomain.workers.dev`。

> **自定义域名**：在 Cloudflare Dashboard → Workers → 你的 Worker → 设置 → 触发器 → 自定义域中添加你的域名。

### 第三步：配置 CORS

编辑 `workers/wrangler.toml`，将 `CORS_ORIGIN` 改为你的前端域名：

```toml
[vars]
CORS_ORIGIN = "https://your-domain.com,http://localhost:5173"
```

修改后重新部署：

```bash
npm run deploy
```

### 第四步：配置前端

1. 编辑 `frontend/.env.production`，设置后端 API 地址：

```env
VITE_API_URL=https://your-api-domain.com
```

2. 安装依赖并构建：

```bash
cd frontend
npm install
npm run build
```

构建产物在 `frontend/dist/` 目录中。

### 第五步：部署前端

**方式 A：Cloudflare Pages**

```bash
cd frontend
npx wrangler pages deploy dist --project-name=kids-art-gallery
```

**方式 B：腾讯云 EdgeOne Pages / Vercel / Netlify**

将 `frontend/dist` 目录上传到对应的静态托管服务即可。注意配置 SPA 路由回退（所有路径返回 `index.html`）。

### 第六步：本地开发

```bash
# 终端 1：启动后端本地开发服务器
cd workers
npm run dev
# Workers 本地运行在 http://localhost:8787

# 终端 2：启动前端开发服务器
cd frontend
npm run dev
# 前端运行在 http://localhost:5173，/api 请求自动代理到 8787
```

---

## 🔒 安全设计

- 上传入口需密码验证，密码存储在 Cloudflare Workers Secrets 中
- 图片上传采用 Token 机制：先验证密码获取上传 URL，再上传文件
- 编辑、删除、同步操作均需 Bearer Token 鉴权
- 元数据写入使用 ETag 乐观锁 + 条件写入检测，防止并发覆盖

---

## 📄 API 概览

| 方法 | 路径 | 功能 | 认证 |
|------|------|------|------|
| `POST` | `/api/token` | 验证密码，获取上传 URL | 密码在 body |
| `PUT` | `/api/upload/:key` | 上传图片到 R2 | Token URL |
| `POST` | `/api/register` | 注册作品元数据 | 无 |
| `GET` | `/api/list` | 获取作品列表 | 无 |
| `PUT` | `/api/artwork` | 更新作品信息 | Bearer Token |
| `DELETE` | `/api/artwork` | 删除作品 | Bearer Token |
| `POST` | `/api/sync` | 同步孤立文件 | Bearer Token |

---

## 📝 License

[MIT](./LICENSE)
