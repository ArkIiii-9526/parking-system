<script setup>
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
import Background from './components/Background.vue'
</script>

<template>
  <div class="app-container">
    <Background />
    <NavBar />
    <main class="content-wrapper">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
}
</style>
