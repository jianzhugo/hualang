# 🎨 儿童画作画廊开发指南 (Vue3 + Cloudflare R2/Workers + EdgeOne Pages)

## 📖 项目概述
开发一个纯静态、无服务器维护的家庭儿童画作展示网站。核心架构：
- **前端**：Vue 3 + TypeScript + Vite + Pinia + Vue Router + TailwindCSS
- **存储**：Cloudflare R2（Bucket 名称：`kids-art-gallery`）
- **后端/鉴权/元数据**：Cloudflare Workers（提供预签名上传、密码校验、画廊列表）
- **托管**：腾讯云 EdgeOne Pages（免费静态托管）
- **核心功能**：固定密码验证上传、前端可勾选压缩转 WebP、直传 R2、自动记录上传者、响应式瀑布流画廊、灯箱预览、多用户并发安全。

## 前端
包含首页、画廊、上传、关于等页面
现代简约、酷炫风格设计、动态效果

## Cloudflare Worker 后端开发

生成可部署的 Workers 项目，实现预签名直传、密码校验、元数据管理与画廊列表接口。

### ⚠️ 关键注意事项
1. R2 预签名 PUT 必须原样携带 Worker 返回的 headers，不可自行修改 Content-Type 或添加额外请求头
2. metadata.json 读写 必须使用 ETag 乐观锁，禁止直接覆盖，否则多用户同时上传会导致数据丢失
3. 前端压缩 必须在浏览器端完成，Workers 仅负责签发链接，不中转文件流
5. 移动端触摸滑动需设置 touch-action: pan-y 防止与页面滚动冲突