<template>
  <div class="min-h-screen flex flex-col bg-canvas">
    <NavBar />
    <div class="flex-1">
      <router-view />
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import NavBar from './components/NavBar.vue'
import Footer from './components/Footer.vue'
</script>
