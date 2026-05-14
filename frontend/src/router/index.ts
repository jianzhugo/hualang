import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GalleryView from '../views/GalleryView.vue'
import UploadView from '../views/UploadView.vue'
import AboutView from '../views/AboutView.vue'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior() {
    return { top: 0, left: 0 }
  },
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/gallery',
      name: 'gallery',
      component: GalleryView,
      meta: { keepAlive: true }
    },
    { path: '/upload', name: 'upload', component: UploadView },
    { path: '/about', name: 'about', component: AboutView }
  ]
})

export default router
